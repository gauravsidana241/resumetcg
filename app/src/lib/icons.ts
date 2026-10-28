import {
  siApachekafka,
  siDocker,
  siExpress,
  siFramer,
  siGit,
  siGitlab,
  siGnubash,
  siGooglecloud,
  siGoogle,
  siGrafana,
  siHelm,
  siJavascript,
  siJenkins,
  siJest,
  siKubernetes,
  siMocha,
  siMongodb,
  siMongoose,
  siMysql,
  siNextdotjs,
  siNodedotjs,
  siNumpy,
  siNvidia,
  siOnnx,
  siOpenapiinitiative,
  siOpentelemetry,
  siPandas,
  siPostgresql,
  siPwa,
  siPython,
  siPytorch,
  siReact,
  siRedis,
  siRedux,
  siScikitlearn,
  siSequelize,
  siShopify,
  siSocketdotio,
  siSupabase,
  siTailwindcss,
  siTemporal,
  siTensorflow,
  siTerraform,
  siTypescript,
  siVite,
  siVuedotjs,
  siWebpack,
  type SimpleIcon,
} from 'simple-icons'

const icons: Record<string, SimpleIcon> = {
  docker: siDocker,
  express: siExpress,
  framer: siFramer,
  git: siGit,
  gitlab: siGitlab,
  gnubash: siGnubash,
  google: siGoogle,
  googlecloud: siGooglecloud,
  grafana: siGrafana,
  helm: siHelm,
  javascript: siJavascript,
  jenkins: siJenkins,
  jest: siJest,
  kafka: siApachekafka,
  kubernetes: siKubernetes,
  mocha: siMocha,
  mongodb: siMongodb,
  mongoose: siMongoose,
  mysql: siMysql,
  nextjs: siNextdotjs,
  node: siNodedotjs,
  numpy: siNumpy,
  nvidia: siNvidia,
  onnx: siOnnx,
  openapi: siOpenapiinitiative,
  opentelemetry: siOpentelemetry,
  pandas: siPandas,
  postgres: siPostgresql,
  pwa: siPwa,
  python: siPython,
  pytorch: siPytorch,
  react: siReact,
  redis: siRedis,
  redux: siRedux,
  scikitlearn: siScikitlearn,
  sequelize: siSequelize,
  shopify: siShopify,
  socketio: siSocketdotio,
  supabase: siSupabase,
  tailwind: siTailwindcss,
  temporal: siTemporal,
  tensorflow: siTensorflow,
  terraform: siTerraform,
  typescript: siTypescript,
  vite: siVite,
  vue: siVuedotjs,
  webpack: siWebpack,
}

export function getIcon(slug: string): SimpleIcon | undefined {
  return icons[slug]
}

// relative luminance of a 6-digit hex color, 0 (black) to 1 (white)
function luminance(hex: string): number {
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

// The brand color of the card's first logo, for theming Full Art and EX cards.
// Near-black brands (Kafka, Express) would make a dark card darker, so they are skipped.
export function brandColor(slugs: string[]): string | undefined {
  for (const slug of slugs) {
    const hex = icons[slug]?.hex
    if (hex && luminance(hex) > 0.05) return `#${hex}`
  }
  return undefined
}
