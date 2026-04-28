import * as fs from 'fs';
import * as path from 'path';
import { workspaceRoot } from '../utils/fileUtils';

export enum Stack {
  ANGULAR = 'angular',
  REACT = 'react',
  VUE = 'vue',
  SPRING_BOOT = 'spring-boot',
  PYTHON = 'python',
  RUST = 'rust',
  GO = 'go',
  GENERIC = 'generic',
}

export interface DetectionResult {
  hasDddFolder: boolean;
  stack: Stack;
}

export class DddDetector {
  async check(): Promise<DetectionResult> {
    const root = workspaceRoot();
    const hasDddFolder = root ? fs.existsSync(path.join(root, '.ai_context')) : false;
    const stack = root ? this.detectStack(root) : Stack.GENERIC;
    return { hasDddFolder, stack };
  }

  private detectStack(root: string): Stack {
    // Check package.json for JS/TS stacks
    const pkgPath = path.join(root, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        if (deps['@angular/core']) { return Stack.ANGULAR; }
        if (deps['react']) { return Stack.REACT; }
        if (deps['vue']) { return Stack.VUE; }
      } catch {
        // ignore malformed package.json
      }
    }
    if (fs.existsSync(path.join(root, 'pom.xml')) ||
        fs.existsSync(path.join(root, 'build.gradle.kts')) ||
        fs.existsSync(path.join(root, 'build.gradle'))) {
      return Stack.SPRING_BOOT;
    }
    if (fs.existsSync(path.join(root, 'Cargo.toml'))) { return Stack.RUST; }
    if (fs.existsSync(path.join(root, 'go.mod'))) { return Stack.GO; }
    if (fs.existsSync(path.join(root, 'requirements.txt')) ||
        fs.existsSync(path.join(root, 'pyproject.toml'))) {
      return Stack.PYTHON;
    }
    return Stack.GENERIC;
  }
}
