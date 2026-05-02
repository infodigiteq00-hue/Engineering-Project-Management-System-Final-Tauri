import { useEffect, useMemo, useState } from "react";
import { Apple, Download as DownloadIcon, Laptop, MonitorDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Platform = "windows" | "macos" | "linux";

const downloadUrlsFromEnv = (): Record<Platform, string> => ({
  windows: import.meta.env.VITE_DOWNLOAD_URL_WINDOWS?.trim() ?? "",
  macos: import.meta.env.VITE_DOWNLOAD_URL_MACOS?.trim() ?? "",
  linux: import.meta.env.VITE_DOWNLOAD_URL_LINUX?.trim() ?? "",
});

const detectPlatform = (): Platform | null => {
  if (typeof navigator === "undefined") {
    return null;
  }

  const source = `${navigator.userAgent || ""} ${(navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform || ""}`.toLowerCase();

  if (source.includes("win")) return "windows";
  if (source.includes("mac")) return "macos";
  if (source.includes("linux") || source.includes("x11")) return "linux";
  return null;
};

const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "Size unavailable";
  }

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, index);
  const precision = index === 0 ? 0 : 1;
  return `${value.toFixed(precision)} ${units[index]}`;
};

/**
 * GitHub release download URLs cannot be sized via browser HEAD (CORS / no content-length).
 * Public REST API returns asset sizes and allows browser CORS for anonymous reads.
 */
async function fetchGitHubReleaseAssetSize(assetUrl: string): Promise<number | null> {
  try {
    const u = new URL(assetUrl);
    const host = u.hostname.replace(/^www\./, "");
    if (host !== "github.com") return null;

    const path = u.pathname.replace(/^\/+|\/+$/g, "");
    const tagged = path.match(/^([^/]+)\/([^/]+)\/releases\/download\/([^/]+)\/(.+)$/);
    if (tagged) {
      const [, owner, repo, tag, fileSegment] = tagged;
      const fileName = decodeURIComponent(fileSegment);
      const api = `https://api.github.com/repos/${owner}/${repo}/releases/tags/${encodeURIComponent(tag)}`;
      const res = await fetch(api, { headers: { Accept: "application/vnd.github+json" } });
      if (!res.ok) return null;
      const data = (await res.json()) as { assets?: Array<{ name: string; size: number }> };
      const asset = data.assets?.find((a) => a.name === fileName || a.name === fileSegment);
      return asset?.size ?? null;
    }

    const latest = path.match(/^([^/]+)\/([^/]+)\/releases\/latest\/download\/(.+)$/);
    if (latest) {
      const [, owner, repo, fileSegment] = latest;
      const fileName = decodeURIComponent(fileSegment);
      const api = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
      const res = await fetch(api, { headers: { Accept: "application/vnd.github+json" } });
      if (!res.ok) return null;
      const data = (await res.json()) as { assets?: Array<{ name: string; size: number }> };
      const asset = data.assets?.find(
        (a) => a.name === fileName || a.name === fileSegment || a.name === decodeURI(fileSegment),
      );
      return asset?.size ?? null;
    }
  } catch {
    return null;
  }
  return null;
}

async function fetchRemoteFileSize(url: string): Promise<number | null> {
  const gh = await fetchGitHubReleaseAssetSize(url);
  if (gh != null) return gh;

  try {
    const head = await fetch(url, { method: "HEAD", redirect: "follow", mode: "cors" });
    const cl = head.headers.get("content-length");
    const n = cl ? Number(cl) : NaN;
    if (Number.isFinite(n) && n > 0) return n;
  } catch {
    // ignore
  }

  try {
    const range = await fetch(url, {
      method: "GET",
      headers: { Range: "bytes=0-0" },
      redirect: "follow",
      mode: "cors",
    });
    const cr = range.headers.get("content-range");
    if (cr) {
      const total = cr.split("/").pop();
      const n = total ? Number(total) : NaN;
      if (Number.isFinite(n) && n > 0) return n;
    }
  } catch {
    // ignore
  }

  return null;
}

const Download = () => {
  const recommended = useMemo(() => detectPlatform(), []);
  const downloadUrls = useMemo(() => downloadUrlsFromEnv(), []);

  const platformConfig = useMemo(
    () =>
      ({
        windows: {
          label: "Windows",
          subtitle: "Windows 10+",
          icon: MonitorDown,
          href: downloadUrls.windows,
        },
        macos: {
          label: "macOS",
          subtitle: "macOS 12+ (Apple Silicon build)",
          icon: Apple,
          href: downloadUrls.macos,
        },
        linux: {
          label: "Linux",
          subtitle: "Ubuntu, Debian, Fedora",
          icon: Laptop,
          href: downloadUrls.linux,
        },
      }) satisfies Record<
        Platform,
        {
          label: string;
          subtitle: string;
          icon: typeof Laptop;
          href: string;
        }
      >,
    [downloadUrls],
  );

  const [fileSizes, setFileSizes] = useState<Record<Platform, string>>({
    windows: "—",
    macos: "—",
    linux: "—",
  });

  useEffect(() => {
    let active = true;

    const loadFileSizes = async () => {
      const entries = await Promise.all(
        (Object.keys(platformConfig) as Platform[]).map(async (platform) => {
          const url = platformConfig[platform].href;
          if (!url) {
            return [platform, "—"] as const;
          }

          const bytes = await fetchRemoteFileSize(url);
          if (bytes != null) {
            return [platform, formatBytes(bytes)] as const;
          }
          return [platform, "Size unavailable"] as const;
        }),
      );

      if (!active) return;
      setFileSizes((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
    };

    void loadFileSizes();

    return () => {
      active = false;
    };
  }, [platformConfig]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <section className="text-center">
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Downloads</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Get the desktop app
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Download the latest version for your operating system. The recommended option is highlighted automatically.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {(Object.keys(platformConfig) as Platform[]).map((platform) => {
            const item = platformConfig[platform];
            const Icon = item.icon;
            const isRecommended = recommended === platform;

            return (
              <Card
                key={platform}
                className={cn(
                  "border-border transition-all",
                  isRecommended && "border-primary shadow-lg shadow-primary/10",
                )}
              >
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="inline-flex rounded-md bg-muted p-2">
                      <Icon className="h-5 w-5 text-foreground" />
                    </div>
                  </div>
                  <div>
                    <CardTitle className="text-xl">{item.label}</CardTitle>
                    <CardDescription className="mt-1">{item.subtitle}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  {item.href ? (
                    <Button asChild className="h-auto w-full py-3">
                      <a href={item.href} target="_blank" rel="noreferrer">
                        <span className="inline-flex items-center gap-2">
                          <DownloadIcon className="h-4 w-4" />
                          Download for {item.label}
                        </span>
                        <span className="ml-2 text-xs font-normal opacity-90">({fileSizes[platform]})</span>
                      </a>
                    </Button>
                  ) : (
                    <Button type="button" disabled className="h-auto w-full py-3">
                      <span>Set VITE_DOWNLOAD_URL_{platform.toUpperCase()} in .env</span>
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="mx-auto w-full max-w-2xl rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">Getting started</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-border bg-background p-4">
              <p className="text-sm font-medium text-foreground">1. Download & unzip</p>
              <p className="mt-1 text-sm text-muted-foreground">Download your platform build and unzip if needed.</p>
            </div>
            <div className="rounded-md border border-border bg-background p-4">
              <p className="text-sm font-medium text-foreground">2. Install</p>
              <p className="mt-1 text-sm text-muted-foreground">Run the installer and complete the setup flow.</p>
            </div>
            <div className="rounded-md border border-border bg-background p-4">
              <p className="text-sm font-medium text-foreground">3. Open & login</p>
              <p className="mt-1 text-sm text-muted-foreground">Open the app and sign in with your account.</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Set <code>VITE_DOWNLOAD_URL_WINDOWS</code>, <code>VITE_DOWNLOAD_URL_MACOS</code>, and{" "}
            <code>VITE_DOWNLOAD_URL_LINUX</code> in <code>.env</code> or your host env (see <code>.env.example</code>
            ). Restart the dev server after changing env.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Download;
