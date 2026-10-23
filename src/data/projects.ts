import type { ImageMetadata } from "astro";
import ravenTranslateNativeIcon from "@/assets/projects/raven-translate-native.png";

type Locale = "zh" | "en";

type ProjectCopy = {
  kind: string;
  status: string;
  tagline: string;
};

export type Project = {
  id: string;
  name: string;
  icon: ImageMetadata;
  /** Public page or repository; the row renders as static text when omitted. */
  href?: string;
  copy: Record<Locale, ProjectCopy>;
};

export type LocalizedProject = Omit<Project, "copy"> & ProjectCopy;

const projects: Project[] = [
  {
    id: "raven-translate-native",
    name: "Raven-Translate",
    icon: ravenTranslateNativeIcon,
    href: "https://lhjzy.github.io/raven-translate-native-site/",
    copy: {
      zh: {
        kind: "macOS 应用",
        status: "预览版",
        tagline: "在任意应用中选中文本，按快捷键翻译或检查英文。",
      },
      en: {
        kind: "macOS app",
        status: "Preview",
        tagline: "Select text in any app and press a shortcut to translate it or check your English.",
      },
    },
  },
];

/** Returns projects with copy for the given locale, falling back to English. */
export function getProjects(locale: string): LocalizedProject[] {
  const lang: Locale = locale === "zh" ? "zh" : "en";
  return projects.map(({ copy, ...project }) => ({
    ...project,
    ...copy[lang],
  }));
}
