# Installation Guide - MCP MacOS Control

## Installation Methods

### 1️⃣ Install via NPM (Global)

```bash
npm install -g mcp-macos-control@latest
```

### 2️⃣ Run via NPX (No Install)

```bash
npx mcp-macos-control@latest
```

### 3️⃣ Local Installation (For Development)

```bash
git clone https://github.com/hwanyong/mcp-macos-control.git
cd mcp-macos-control
npm install
npm link
```

## VSCode AI Agent Configuration

### 📦 Cline Extension

1. Install **Cline** extension in VSCode
2. Command Palette (`Cmd+Shift+P`) → `Cline: Open Settings`
3. Add to MCP Servers section:

**Using NPX (Recommended):**
```json
{
  "mcpServers": {
    "macos-control": {
      "command": "npx",
      "args": ["mcp-macos-control@latest"]
    }
  }
}
```

### 📦 Continue.dev Extension

Config file: `~/.continue/config.json`

**Using NPX (Recommended):**
```json
{
  "experimental": {
    "modelContextProtocolServers": [
      {
        "name": "macos-control",
        "transport": {
          "type": "stdio",
          "command": "npx",
          "args": ["mcp-macos-control@latest"]
        }
      }
    ]
  }
}
```

### 📦 Claude Desktop

Config file: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "macos-control": {
      "command": "npx",
      "args": ["mcp-macos-control@latest"]
    }
  }
}
```

## Permissions Setup

⚠️ **IMPORTANT:** You must grant the following permissions on MacOS:

1. **Accessibility** - For mouse/keyboard control
2. **Screen Recording** - For screenshots

**Settings Path:**
```
System Settings > Privacy & Security > Accessibility / Screen Recording
```

Grant permissions to the application you are using (VSCode, Terminal, Claude, etc.).

## Testing

Test after installation:
```bash
# Verify server is running
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npx mcp-macos-control
```

## AI Agent Usage Examples

After configuration, you can ask the AI agent:

```
"Take a screenshot of the current screen"
→ Uses take_screenshot tool

"Move mouse to the center of the screen"
→ Uses get_screen_size + mouse_move tools

"Press Command+C to copy"
→ Uses keyboard_press tool

"Type Hello World"
→ Uses keyboard_type tool
```

## Troubleshooting

### Permission Errors
```
Error: Command failed: screencapture...
```
→ Check Screen Recording permissions.

### Server Connection Failed
```
Error: spawn mcp-macos-control ENOENT
```
→ Ensure npm link worked or use npx.

## Updates

```bash
npm update -g mcp-macos-control
```
