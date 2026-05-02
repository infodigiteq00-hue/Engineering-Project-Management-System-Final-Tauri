import { useEffect, useMemo, useState } from "react";
import { Apple, Download as DownloadIcon, Laptop, MonitorDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Platform = "windows" | "macos" | "linux";

const releases = {
  windows: "https://github.com/your-org/your-repo/releases/latest/download/your-app-windows.exe",
  macos: "https://github.com/your-org/your-repo/releases/latest/download/your-app-macos.dmg",
  linux: "https://github.com/your-org/your-repo/releases/latest/download/your-app-linux.AppImage",
} as const;

const platformConfig: Record<
  Platform,
  {
    label: string;
    subtitle: string;
    icon: typeof Laptop;
    href: string;
  }
> = {
  windows: {
    label: "Windows",
    subtitle: "Windows 10+",
    icon: MonitorDown,
    href: releases.windows,
  },
  macos: {
    label: "macOS",
    subtitle: "macOS 12+",
    icon: Apple,
    href: releases.macos,
  },
  linux: {
    label: "Linux",
    subtitle: "Ubuntu, Debian, Fedora",
    icon: Laptop,
    href: releases.linux,
  },
};

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

const Download = () => {
  const recommended = useMemo(() => detectPlatform(), []);
  const [fileSizes, setFileSizes] = useState<Record<Platform, string>>({
    windows: "Checking size...",
    macos: "Checking size...",
    linux: "Checking size...",
  });

  useEffect(() => {
    let active = true;

    const loadFileSizes = async () => {
      const entries = await Promise.all(
        (Object.keys(platformConfig) as Platform[]).map(async (platform) => {
          const url = platformConfig[platform].href;

          try {
            const response = await fetch(url, { method: "HEAD", redirect: "follow" });
            const contentLength = response.headers.get("content-length");
            const parsed = contentLength ? Number(contentLength) : NaN;
            return [platform, formatBytes(parsed)] as const;
          } catch {
            return [platform, "Size unavailable"] as const;
          }
        }),
      );

      if (!active) return;
      setFileSizes((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
    };

    void loadFileSizes();

    return () => {
      active = false;
    };
  }, []);

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
                  <Button asChild className="h-auto w-full py-3">
                    <a href={item.href} target="_blank" rel="noreferrer">
                      <span className="inline-flex items-center gap-2">
                        <DownloadIcon className="h-4 w-4" />
                        Download for {item.label}
                      </span>
                      <span className="ml-2 text-xs font-normal opacity-90">({fileSizes[platform]})</span>
                    </a>
                  </Button>
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
            Replace placeholder GitHub release URLs in <code>src/pages/Download.tsx</code> to fetch real file sizes.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Download;
