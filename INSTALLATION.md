# Installation Guide - MCP MacOS Control

## 설치 방법

### 1️⃣ NPM으로 설치 (전역 설치)

```bash
npm install -g mcp-macos-control
```

### 2️⃣ 로컬에서 설치 (개발용)

```bash
cd /Users/uhd/.gemini/antigravity/playground/velvet-pulsar
npm install
npm link
```

## VSCode AI Agent 설정

### 📦 Cline 확장 설정

1. VSCode에서 **Cline** 확장 설치
2. Command Palette (`Cmd+Shift+P`) → `Cline: Open Settings`
3. MCP Servers 섹션에서 설정:

**전역 설치한 경우:**
```json
{
  "mcpServers": {
    "macos-control": {
      "command": "mcp-macos-control"
    }
  }
}
```

**로컬 경로 사용:**
```json
{
  "mcpServers": {
    "macos-control": {
      "command": "node",
      "args": ["/Users/uhd/.gemini/antigravity/playground/velvet-pulsar/index.cjs"]
    }
  }
}
```

### 📦 Continue.dev 확장 설정

설정 파일 위치: `~/.continue/config.json`

**전역 설치한 경우:**
```json
{
  "experimental": {
    "modelContextProtocolServers": [
      {
        "name": "macos-control",
        "transport": {
          "type": "stdio",
          "command": "mcp-macos-control"
        }
      }
    ]
  }
}
```

**로컬 경로 사용:**
```json
{
  "experimental": {
    "modelContextProtocolServers": [
      {
        "name": "macos-control",
        "transport": {
          "type": "stdio",
          "command": "node",
          "args": ["/Users/uhd/.gemini/antigravity/playground/velvet-pulsar/index.cjs"]
        }
      }
    ]
  }
}
```

### 📦 Claude Desktop 설정

설정 파일 위치: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "macos-control": {
      "command": "mcp-macos-control"
    }
  }
}
```

## 권한 설정

⚠️ **중요:** MacOS에서 다음 권한을 부여해야 합니다:

1. **접근성(Accessibility)** - 마우스/키보드 제어용
2. **화면 녹화(Screen Recording)** - 스크린샷용

**설정 경로:**
```
시스템 설정 > 개인 정보 보호 및 보안 > 접근성/화면 녹화
```

사용하는 애플리케이션(VSCode, Terminal 등)에 권한을 부여하세요.

## 테스트

설치 후 테스트:
```bash
# 서버가 정상 작동하는지 확인
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | mcp-macos-control
```

## AI Agent 사용 예시

설정 완료 후 AI agent에게 다음과 같이 요청할 수 있습니다:

```
"현재 화면을 스크린샷으로 찍어줘"
→ take_screenshot 도구 사용

"마우스를 화면 중앙으로 이동해줘"
→ get_screen_size + mouse_move 도구 조합 사용

"Command+C를 눌러서 복사해줘"
→ keyboard_press 도구 사용

"Hello World를 입력해줘"
→ keyboard_type 도구 사용
```

## 문제 해결

### 권한 오류
```
Error: Command failed: screencapture...
```
→ 화면 녹화 권한을 확인하세요

### 서버 연결 실패
```
Error: spawn mcp-macos-control ENOENT
```
→ npm link가 제대로 되었는지 확인하거나 전체 경로를 사용하세요

## 업데이트

```bash
npm update -g mcp-macos-control
```
