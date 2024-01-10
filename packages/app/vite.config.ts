import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import rushLib from '@microsoft/rush-lib';
import { join } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const isDev = process.env.NODE_ENV === 'development';
const rootDir = process.cwd();

export const findCurrentPackageJson = () => {
  const pckFile = join(rootDir, 'package.json');
  return JSON.parse(readFileSync(pckFile).toString());
};

const getAllRelatedProjects = (project, dependencyProjects = []) => {
  project.dependencyProjects.forEach((dependency) => {
    if (!dependencyProjects.includes(dependency)) {
      dependencyProjects.push(dependency);
      getAllRelatedProjects(dependency, dependencyProjects);
    }
  });
  return dependencyProjects;
};

const getAliases = () => {
  const rushConfig = rushLib.RushConfiguration.loadFromDefaultLocation();
  const packageJson = findCurrentPackageJson() as { name: string };
  const rootProjectName = packageJson.name;
  const rootProject = rushConfig.findProjectByShorthandName(rootProjectName);
  const relatedProjects = rootProject ? getAllRelatedProjects(rootProject) : rushConfig.projects;
  return relatedProjects.reduce((result, item) => {
    const srcFile = join(item.projectFolder, 'src/index.ts');
    if (existsSync(srcFile)) {
      result[item.packageName] = srcFile;
    }
    return result;
  }, ({}));
};


export default defineConfig({
  resolve: {
    alias: isDev ? getAliases(): {}
  },
  plugins: [react()],
})

