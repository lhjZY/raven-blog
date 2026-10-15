import type { ImageMetadata } from "astro";
import ravenTranslateIcon from "@/assets/projects/raven-translate.png";
import ravenTranslateNativeIcon from "@/assets/projects/raven-translate-native.png";
import ravenTodoIcon from "@/assets/projects/raven-todo.png";

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
    id: "raven-translate",
    name: "Raven-Translate",
    icon: ravenTranslateIcon,
    copy: {
      zh: {
        kind: "浏览器扩展",
        status: "持续迭代",
        tagline: "划词与整页翻译，支持 Google 与自定义 AI 引擎。",
      },
      en: {
        kind: "Browser extension",
        status: "Active",
        tagline:
          "Selection and full-page translation with Google or your own AI.",
      },
    },
  },
  {
    id: "raven-translate-native",
    name: "Raven-Translate Native",
    icon: ravenTranslateNativeIcon,
    copy: {
      zh: {
        kind: "macOS 应用",
        status: "开发中",
        tagline: "在桌面上完成翻译、英文检查与长难句分析。",
      },
      en: {
        kind: "macOS app",
        status: "In progress",
        tagline:
          "Translate, proofread and parse long sentences on the desktop.",
      },
    },
  },
  {
    id: "raven-todo",
    name: "Raven Todo",
    icon: ravenTodoIcon,
    copy: {
      zh: {
        kind: "Web 应用",
        status: "v0.1",
        tagline: "列表、看板与时间线视图，数据只保存在本地浏览器。",
      },
      en: {
        kind: "Web app",
        status: "v0.1",
        tagline: "List, board and timeline views; data stays in your browser.",
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
