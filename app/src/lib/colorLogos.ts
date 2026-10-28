// Full-color logos from Devicon (MIT), shown on Full Art and EX cards.
// Logos without a Devicon version fall back to the Simple Icons mark in its brand color.
import amazonwebservicesLogo from 'devicon/icons/amazonwebservices/amazonwebservices-original-wordmark.svg?url'
import dockerLogo from 'devicon/icons/docker/docker-original.svg?url'
import expressLogo from 'devicon/icons/express/express-original.svg?url'
import framerLogo from 'devicon/icons/framermotion/framermotion-original.svg?url'
import gitlabLogo from 'devicon/icons/gitlab/gitlab-original.svg?url'
import gitLogo from 'devicon/icons/git/git-original.svg?url'
import gnubashLogo from 'devicon/icons/bash/bash-original.svg?url'
import googlecloudLogo from 'devicon/icons/googlecloud/googlecloud-original.svg?url'
import googleLogo from 'devicon/icons/google/google-original.svg?url'
import grafanaLogo from 'devicon/icons/grafana/grafana-original.svg?url'
import helmLogo from 'devicon/icons/helm/helm-original.svg?url'
import javascriptLogo from 'devicon/icons/javascript/javascript-original.svg?url'
import jenkinsLogo from 'devicon/icons/jenkins/jenkins-original.svg?url'
import jestLogo from 'devicon/icons/jest/jest-plain.svg?url'
import kafkaLogo from 'devicon/icons/apachekafka/apachekafka-original.svg?url'
import kubernetesLogo from 'devicon/icons/kubernetes/kubernetes-original.svg?url'
import mochaLogo from 'devicon/icons/mocha/mocha-original.svg?url'
import mongodbLogo from 'devicon/icons/mongodb/mongodb-original.svg?url'
import mongooseLogo from 'devicon/icons/mongoose/mongoose-original.svg?url'
import mysqlLogo from 'devicon/icons/mysql/mysql-original.svg?url'
import nextjsLogo from 'devicon/icons/nextjs/nextjs-original.svg?url'
import nodeLogo from 'devicon/icons/nodejs/nodejs-original.svg?url'
import numpyLogo from 'devicon/icons/numpy/numpy-original.svg?url'
import openapiLogo from 'devicon/icons/openapi/openapi-original.svg?url'
import opentelemetryLogo from 'devicon/icons/opentelemetry/opentelemetry-original.svg?url'
import pandasLogo from 'devicon/icons/pandas/pandas-original.svg?url'
import postgresLogo from 'devicon/icons/postgresql/postgresql-original.svg?url'
import pythonLogo from 'devicon/icons/python/python-original.svg?url'
import pytorchLogo from 'devicon/icons/pytorch/pytorch-original.svg?url'
import reactLogo from 'devicon/icons/react/react-original.svg?url'
import redisLogo from 'devicon/icons/redis/redis-original.svg?url'
import reduxLogo from 'devicon/icons/redux/redux-original.svg?url'
import scikitlearnLogo from 'devicon/icons/scikitlearn/scikitlearn-original.svg?url'
import sequelizeLogo from 'devicon/icons/sequelize/sequelize-original.svg?url'
import socketioLogo from 'devicon/icons/socketio/socketio-original.svg?url'
import supabaseLogo from 'devicon/icons/supabase/supabase-original.svg?url'
import tailwindLogo from 'devicon/icons/tailwindcss/tailwindcss-original.svg?url'
import tensorflowLogo from 'devicon/icons/tensorflow/tensorflow-original.svg?url'
import terraformLogo from 'devicon/icons/terraform/terraform-original.svg?url'
import typescriptLogo from 'devicon/icons/typescript/typescript-original.svg?url'
import viteLogo from 'devicon/icons/vitejs/vitejs-original.svg?url'
import vueLogo from 'devicon/icons/vuejs/vuejs-original.svg?url'
import webpackLogo from 'devicon/icons/webpack/webpack-original.svg?url'

const logos: Record<string, string> = {
  amazonwebservices: amazonwebservicesLogo,
  docker: dockerLogo,
  express: expressLogo,
  framer: framerLogo,
  git: gitLogo,
  gitlab: gitlabLogo,
  gnubash: gnubashLogo,
  google: googleLogo,
  googlecloud: googlecloudLogo,
  grafana: grafanaLogo,
  helm: helmLogo,
  javascript: javascriptLogo,
  jenkins: jenkinsLogo,
  jest: jestLogo,
  kafka: kafkaLogo,
  kubernetes: kubernetesLogo,
  mocha: mochaLogo,
  mongodb: mongodbLogo,
  mongoose: mongooseLogo,
  mysql: mysqlLogo,
  nextjs: nextjsLogo,
  node: nodeLogo,
  numpy: numpyLogo,
  openapi: openapiLogo,
  opentelemetry: opentelemetryLogo,
  pandas: pandasLogo,
  postgres: postgresLogo,
  python: pythonLogo,
  pytorch: pytorchLogo,
  react: reactLogo,
  redis: redisLogo,
  redux: reduxLogo,
  scikitlearn: scikitlearnLogo,
  sequelize: sequelizeLogo,
  socketio: socketioLogo,
  supabase: supabaseLogo,
  tailwind: tailwindLogo,
  tensorflow: tensorflowLogo,
  terraform: terraformLogo,
  typescript: typescriptLogo,
  vite: viteLogo,
  vue: vueLogo,
  webpack: webpackLogo,
}

// mostly black logos that need a light glow behind them on a dark card
const DARK = new Set(['amazonwebservices', 'express', 'kafka', 'nextjs', 'socketio', 'temporal'])

export function getColorLogo(slug: string): string | undefined {
  return logos[slug]
}

export function isDarkLogo(slug: string): boolean {
  return DARK.has(slug)
}
