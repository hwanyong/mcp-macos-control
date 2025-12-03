# MacOS Control MCP Server

## Overview
An MCP (Model Context Protocol) server that enables AI agents to control MacOS systems.
It provides capabilities for keyboard input, mouse control, clipboard management, and screenshot capture.

## ✨ New in v2.2
- 📸 **Enhanced Screenshot**: Support for both file saving and clipboard copying
- 🛡️ **Robust Error Handling**: Input validation, screen boundary checks, detailed error messages
- 📋 **Clipboard Control**: Copy, paste, and read clipboard content
- 🎯 **Advanced Drag & Drop**: Smooth animation with speed control
- 📝 **Logging System**: Winston-based structured logging with auto-rotation

## Features
- **Mouse Control**: Move, click, drag, drag & drop
- **Keyboard Control**: Type text, press key combinations
- **Clipboard Control**: Copy, paste, read
- **Screenshot**: Capture screen (save to file or copy to clipboard)
- **Window Management**: List windows, focus app, get active window info
- **Utilities**: Get mouse position, get screen size

## Installation

### Method 1: Run via NPX (Recommended) ✨

Use immediately without installation:
```bash
npx mcp-macos-control
```

### Method 2: Global NPM Installation

```bash
npm install -g mcp-macos-control
```

Run after installation:
```bash
mcp-macos-control
```

### Method 3: Local Development

```bash
git clone https://github.com/hwanyong/mcp-macos-control.git
cd mcp-macos-control
npm install
npm link
```

## Usage

### Direct Execution
```bash
# Using NPX (Recommended)
npx mcp-macos-control

# Or after global installation
mcp-macos-control

# Or for local development
node index.cjs
```

### Permissions

First-time execution requires MacOS permissions:
1. **Accessibility**: For keyboard/mouse control
   - `System Settings > Privacy & Security > Accessibility`
2. **Screen Recording**: For screenshots
   - `System Settings > Privacy & Security > Screen Recording`

## VSCode AI Agent Configuration

### Cline Extension

**Method 1: Using NPX (Recommended)**
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

**Method 2: Using Global Install**
```json
{
  "mcpServers": {
    "macos-control": {
      "command": "mcp-macos-control"
    }
  }
}
```

### Continue.dev Extension

**Method 1: Using NPX (Recommended)**
Add to `~/.continue/config.json`:
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

**Method 2: Using Global Install**
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

**Method 1: Using NPX (Recommended)**
Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:
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

**Method 2: Using Global Install**
```json
{
  "mcpServers": {
    "macos-control": {
      "command": "mcp-macos-control"
    }
  }
}
```

> 📁 See `examples/` folder for more configuration examples.

## Available Tools

### Mouse Control

#### 1. `mouse_move`
Move mouse cursor to specified coordinates.
```json
{
  "x": 100,
  "y": 200
}
```

#### 2. `mouse_click`
Click mouse button.
```json
{
  "button": "left",
  "double": false
}
```

#### 3. `mouse_drag`
Drag from current position to target coordinates.
```json
{
  "x": 500,
  "y": 300
}
```

#### 4. `mouse_drag_drop`
Perform complete drag and drop with smooth animation.
```json
{
  "fromX": 100,
  "fromY": 100,
  "toX": 300,
  "toY": 300,
  "duration": 1000
}
```

#### 5. `mouse_scroll`
Scroll mouse wheel.
```json
{
  "direction": "down",
  "amount": 5
}
```

#### 6. `mouse_move_path`
Move mouse through multiple points with smooth interpolation.
```json
{
  "points": [{"x": 100, "y": 100}, {"x": 200, "y": 200}],
  "duration": 1000
}
```

### Keyboard Control

#### 7. `keyboard_type`
Type text string.
```json
{
  "text": "Hello, World!"
}
```

#### 8. `keyboard_press`
Press key or key combination.
```json
{
  "key": "c",
  "modifiers": ["command"]
}
```

### Clipboard Control

#### 9. `clipboard_get`
Get current clipboard content.

#### 10. `clipboard_set`
Set clipboard content.
```json
{
  "text": "Text to copy"
}
```

#### 11. `clipboard_paste`
Paste clipboard content (Simulates Command+V).

### Screen & Window

#### 12. `take_screenshot`
Capture screen. If filename is provided, saves to file. Otherwise, copies to clipboard.
```json
{
  "filename": "screenshot.png" // Optional
}
```

#### 13. `get_mouse_position`
Get current mouse cursor position.

#### 14. `get_screen_size`
Get screen dimensions.

#### 15. `window_list`
Get list of open windows.

#### 16. `window_get_active`
Get information about the active window.

#### 17. `window_focus`
Focus a specific application.
```json
{
  "appName": "Safari"
}
```

## Logging

All operations are logged in the `logs/` directory:
- `logs/combined.log`: All logs
- `logs/error.log`: Errors only

## Disclaimer
⚠️ This tool generates real mouse and keyboard events.
⚠️ Use with caution as AI controls your system.
⚠️ Avoid using during critical tasks.
