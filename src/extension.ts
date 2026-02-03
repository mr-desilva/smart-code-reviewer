import * as vscode from 'vscode';
import * as path from 'path';
import { promises as fs } from 'fs';

async function runReview(
  context: vscode.ExtensionContext,
  selectedText: string,
  defaultGuidelineFile: string
) {
  // Load user-specified guidelines if provided
  const config = vscode.workspace.getConfiguration('codeReviewer');
  let customPath = config.get<string>('guidelinesPath') || '';
  const model = config.get<string>('model') || 'GPT-4o';
  let guidelines = '';

  if (customPath) {
    if (!path.isAbsolute(customPath) && vscode.workspace.workspaceFolders) {
      customPath = path.join(
        vscode.workspace.workspaceFolders[0].uri.fsPath,
        customPath
      );
    }
    try {
      guidelines = await fs.readFile(customPath, 'utf8');
    } catch {
      vscode.window.showWarningMessage(
        `Could not load custom guidelines from ${customPath}. Using default.`
      );
    }
  }

  // Fallback to built-in default prompt
  if (!guidelines) {
    const builtIn = context.asAbsolutePath(
      path.join('default-prompts', defaultGuidelineFile)
    );
    try {
      guidelines = await fs.readFile(builtIn, 'utf8');
    } catch {
      guidelines = '';
    }
  }

  const prompt = [
    `/model ${model}`,
    '',
    `Please review the following code:`,
    '',
    selectedText,
    '',
    `Use these guidelines:`,
    guidelines
  ].join('\n');

  try {
    await vscode.commands.executeCommand('workbench.action.chat.openAsk', prompt);
  } catch {
    vscode.window.showErrorMessage('Unable to invoke GitHub Copilot Chat.');
  }
}

export function activate(context: vscode.ExtensionContext) {
  // Command: Review Angular Code
  const reviewCode = vscode.commands.registerCommand(
    'code-reviewer.reviewCode',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return vscode.window.showInformationMessage('No active editor');
      }
      const text = editor.document.getText(editor.selection).trim();
      if (!text) {
        return vscode.window.showInformationMessage(
          'Please select some code to review'
        );
      }
      await runReview(context, text, 'angular_code_review_guidlines.md');
    }
  );

  // Command: Review Jest Unit Tests
  const reviewTests = vscode.commands.registerCommand(
    'code-reviewer.reviewTests',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return vscode.window.showInformationMessage('No active editor');
      }
      const text = editor.document.getText(editor.selection).trim();
      if (!text) {
        return vscode.window.showInformationMessage(
          'Please select some code to review'
        );
      }
      await runReview(
        context,
        text,
        'jest_unit_test_code_review_guidlines.md'
      );
    }
  );

  context.subscriptions.push(reviewCode, reviewTests);
}

export function deactivate() {}