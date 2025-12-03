# MacOS Control MCP Server

## 개요
MacOS 시스템을 제어할 수 있는 MCP(Model Context Protocol) 서버입니다. 
AI 에이전트가 키보드 입력, 마우스 컨트롤, 클립보드 제어, 스크린샷 기능을 사용할 수 있습니다.

## ✨ v2.0 새로운 기능
- 🛡️ **강화된 에러 처리**: 입력 검증, 화면 경계 체크, 상세한 에러 메시지
- 📋 **클립보드 제어**: 복사, 붙여넣기, 읽기
- 🎯 **향상된 드래그 앤 드롭**: 부드러운 애니메이션과 속도 제어
- 📝 **로깅 시스템**: Winston 기반 구조화된 로그, 자동 파일 로테이션

## 기능
- **마우스 제어**: 커서 이동, 클릭, 드래그, 드래그 앤 드롭
- **키보드 제어**: 텍스트 입력, 키 조합 실행
- **클립보드 제어**: 복사, 붙여넣기, 읽기
- **스크린샷**: 화면 캡처 및 파일 저장
- **유틸리티**: 마우스 위치 확인, 화면 크기 확인

## 설치

### 방법 1: NPX로 바로 실행 (권장) ✨

설치 없이 바로 사용:
```bash
npx mcp-macos-control
```

### 방법 2: NPM 전역 설치

```bash
npm install -g mcp-macos-control
```

설치 후 실행:
```bash
mcp-macos-control
```

### 방법 3: 로컬 개발용 설치

```bash
git clone https://github.com/hwanyong/mcp-macos-control.git
cd mcp-macos-control
npm install
npm link
```

## 실행

### 직접 실행
```bash
# NPX 사용 (설치 불필요) - 권장
npx mcp-macos-control

# 또는 전역 설치 후
mcp-macos-control

# 또는 로컬 개발
node index.cjs
```

### 권한 설정

처음 실행 시 macOS 권한 필요:
1. **접근성(Accessibility)**: 키보드/마우스 제어
   - `시스템 설정 > 개인 정보 보호 및 보안 > 접근성`
2. **화면 녹화(Screen Recording)**: 스크린샷 캡처
   - `시스템 설정 > 개인 정보 보호 및 보안 > 화면 녹화`

## VSCode AI Agent 설정

### Cline 확장

**방법 1: NPX 사용 (설치 불필요) - 권장**
```json
{
  "mcpServers": {
    "macos-control": {
      "command": "npx",
      "args": ["mcp-macos-control"]
    }
  }
}
```

**방법 2: 전역 설치 후 사용**
```json
{
  "mcpServers": {
    "macos-control": {
      "command": "mcp-macos-control"
    }
  }
}
```

### Continue.dev 확장

**방법 1: NPX 사용 - 권장**
`~/.continue/config.json`에 추가:
```json
{
  "experimental": {
    "modelContextProtocolServers": [
      {
        "name": "macos-control",
        "transport": {
          "type": "stdio",
          "command": "npx",
          "args": ["mcp-macos-control"]
        }
      }
    ]
  }
}
```

**방법 2: 전역 설치 후**
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

### Claude Desktop

**방법 1: NPX 사용 - 권장**
`~/Library/Application Support/Claude/claude_desktop_config.json`에 추가:
```json
{
  "mcpServers": {
    "macos-control": {
      "command": "npx",
      "args": ["mcp-macos-control"]
    }
  }
}
```

**방법 2: 전역 설치 후**
```json
{
  "mcpServers": {
    "macos-control": {
      "command": "mcp-macos-control"
    }
  }
}
```

> 📁 더 많은 설정 예시는 `examples/` 폴더를 참고하세요.


## 제공되는 도구

### 마우스 제어

#### 1. `mouse_move`
마우스 커서를 지정된 좌표로 이동합니다.
```json
{
  "x": 100,
  "y": 200
}
```

### 2. `mouse_click`
마우스 버튼을 클릭합니다.
```json
{
  "button": "left",
  "double": false
}
```

### 3. `mouse_drag`
현재 위치에서 목표 좌표까지 드래그합니다.
```json
{
  "x": 500,
  "y": 300
}
```

### 4. `keyboard_type`
텍스트를 입력합니다.
```json
{
  "text": "Hello, World!"
}
```

### 5. `keyboard_press`
키 또는 키 조합을 누릅니다.
```json
{
  "key": "c",
  "modifiers": ["command"]
}
```

### 6. `take_screenshot`
화면을 캡처하여 파일로 저장합니다.
```json
{
  "filename": "screenshot.png"
}
```

### 7. `get_mouse_position`
현재 마우스 커서 위치를 반환합니다.

### 8. `get_screen_size`
화면 크기를 반환합니다.

### 새로운 도구 (v2.0)

#### 9. `mouse_drag_drop`
완전한 드래그 앤 드롭을 수행합니다 (부드러운 애니메이션).
```json
{
  "fromX": 100,
  "fromY": 100,
  "toX": 300,
  "toY": 300,
  "duration": 1000
}
```

#### 10. `clipboard_get`
현재 클립보드 내용을 읽습니다.

#### 11. `clipboard_set`
클립보드에 텍스트를 저장합니다.
```json
{
  "text": "복사할 텍스트"
}
```

#### 12. `clipboard_paste`
클립보드 내용을 붙여넣습니다 (Command+V 시뮬레이션).

## 로그 확인

모든 작업은 `logs/` 디렉토리에 기록됩니다:
- `logs/combined.log`: 모든 작업 로그
- `logs/error.log`: 에러만 기록

로그 예시:
```
[2025-12-03 01:57:04] [INFO] Tool: clipboard_set - Args: {"text":"Hello"} - Tool succeeded
[2025-12-03 01:57:04] [ERROR] Tool: mouse_move - Tool failed - Coordinates exceed screen bounds
```

## 권한 요구사항

MacOS에서 이 도구를 사용하려면 다음 권한이 필요합니다:
- **접근성(Accessibility)**: 키보드/마우스 제어
- **화면 녹화(Screen Recording)**: 스크린샷 캡처

권한 설정: `시스템 설정 > 개인 정보 보호 및 보안 > 접근성/화면 녹화`

## 주의사항
⚠️ 이 도구는 실제 마우스와 키보드 이벤트를 생성합니다. 
⚠️ AI가 시스템을 제어하므로 신중하게 사용하세요.
⚠️ 중요한 작업 중에는 사용을 피하세요.
