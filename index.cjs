#!/usr/bin/env node
const { Server } = require('@modelcontextprotocol/sdk/server/index.js')
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js')
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js')
const robot = require('robotjs')
const clipboardy = require('clipboardy').default || require('clipboardy')
const activeWin = require('active-win')
const { exec } = require('child_process')
const { promisify } = require('util')
const fs = require('fs').promises
const path = require('path')
const { logToolCall, logToolSuccess, logToolError } = require('./logger.cjs')

const execAsync = promisify(exec)

// 헬퍼 함수: 화면 경계 체크
function validateCoordinates(x, y) {
  const screenSize = robot.getScreenSize()

  if (x < 0 || y < 0) {
    throw new Error(`Coordinates cannot be negative. Got: (${x}, ${y})`)
  }

  if (x > screenSize.width || y > screenSize.height) {
    throw new Error(
      `Coordinates (${x}, ${y}) exceed screen bounds (${screenSize.width}x${screenSize.height})`
    )
  }

  return true
}

// 헬퍼 함수: 파일 경로 검증
function validateFilePath(filepath) {
  const dir = path.dirname(filepath)

  if (!dir) {
    throw new Error(`Invalid file path: ${filepath}`)
  }

  return true
}

// 헬퍼 함수: AppleScript 실행
async function runAppleScript(script) {
  const { stdout } = await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`)
  return stdout.trim()
}

// MCP Server 초기화
const server = new Server(
  {
    name: 'macos-control-server',
    version: '2.2.2',
  },
  {
    capabilities: {
      tools: {},
    },
  }
)

// 도구 목록 제공
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // 마우스 제어
      {
        name: 'mouse_move',
        description: 'Move mouse cursor to specified coordinates',
        inputSchema: {
          type: 'object',
          properties: {
            x: { type: 'number', description: 'X coordinate' },
            y: { type: 'number', description: 'Y coordinate' },
          },
          required: ['x', 'y'],
        },
      },
      {
        name: 'mouse_click',
        description: 'Click mouse button at current position',
        inputSchema: {
          type: 'object',
          properties: {
            button: {
              type: 'string',
              enum: ['left', 'right', 'middle'],
              description: 'Mouse button to click',
              default: 'left',
            },
            double: {
              type: 'boolean',
              description: 'Whether to double-click',
              default: false,
            },
          },
        },
      },
      {
        name: 'mouse_drag',
        description: 'Drag mouse from current position to target coordinates',
        inputSchema: {
          type: 'object',
          properties: {
            x: { type: 'number', description: 'Target X coordinate' },
            y: { type: 'number', description: 'Target Y coordinate' },
          },
          required: ['x', 'y'],
        },
      },
      {
        name: 'mouse_drag_drop',
        description: 'Complete drag-and-drop from source to target coordinates',
        inputSchema: {
          type: 'object',
          properties: {
            fromX: { type: 'number', description: 'Source X coordinate' },
            fromY: { type: 'number', description: 'Source Y coordinate' },
            toX: { type: 'number', description: 'Target X coordinate' },
            toY: { type: 'number', description: 'Target Y coordinate' },
            duration: {
              type: 'number',
              description: 'Duration in milliseconds (default: 500)',
              default: 500,
            },
          },
          required: ['fromX', 'fromY', 'toX', 'toY'],
        },
      },

      // 키보드 제어
      {
        name: 'keyboard_type',
        description: 'Type a string of text',
        inputSchema: {
          type: 'object',
          properties: {
            text: { type: 'string', description: 'Text to type' },
          },
          required: ['text'],
        },
      },
      {
        name: 'keyboard_press',
        description: 'Press a key or key combination',
        inputSchema: {
          type: 'object',
          properties: {
            key: { type: 'string', description: 'Key to press' },
            modifiers: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['command', 'control', 'alt', 'shift'],
              },
              description: 'Optional modifier keys',
            },
          },
          required: ['key'],
        },
      },

      // 스크린샷
      {
        name: 'take_screenshot',
        description: 'Capture the screen. If filename is provided, saves to file. Otherwise, copies to clipboard.',
        inputSchema: {
          type: 'object',
          properties: {
            filename: {
              type: 'string',
              description: 'Filename to save screenshot (optional). If omitted, screenshot is copied to clipboard.',
            },
          },
        },
      },

      // 클립보드 제어
      {
        name: 'clipboard_get',
        description: 'Get current clipboard content',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'clipboard_set',
        description: 'Set clipboard content',
        inputSchema: {
          type: 'object',
          properties: {
            text: { type: 'string', description: 'Text to copy to clipboard' },
          },
          required: ['text'],
        },
      },
      {
        name: 'clipboard_paste',
        description: 'Paste clipboard content (simulates Command+V)',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },

      // 마우스 스크롤 (v2.1)
      {
        name: 'mouse_scroll',
        description: 'Scroll mouse wheel in specified direction',
        inputSchema: {
          type: 'object',
          properties: {
            direction: {
              type: 'string',
              enum: ['up', 'down', 'left', 'right'],
              description: 'Scroll direction',
            },
            amount: {
              type: 'number',
              description: 'Scroll amount (default: 5)',
              default: 5,
            },
          },
          required: ['direction'],
        },
      },

      // 경로 제어 (v2.1)
      {
        name: 'mouse_move_path',
        description: 'Move mouse through multiple points with smooth interpolation',
        inputSchema: {
          type: 'object',
          properties: {
            points: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  x: { type: 'number' },
                  y: { type: 'number' },
                },
                required: ['x', 'y'],
              },
              description: 'Array of {x, y} coordinates to follow',
            },
            duration: {
              type: 'number',
              description: 'Total duration in milliseconds (default: 1000)',
              default: 1000,
            },
          },
          required: ['points'],
        },
      },

      // 윈도우 관리 (v2.1)
      {
        name: 'window_list',
        description: 'Get list of all open windows',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'window_get_active',
        description: 'Get currently active window information',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'window_focus',
        description: 'Focus/activate a specific application window',
        inputSchema: {
          type: 'object',
          properties: {
            appName: {
              type: 'string',
              description: 'Application name to focus (e.g., "Safari", "Visual Studio Code")',
            },
          },
          required: ['appName'],
        },
      },

      // 유틸리티
      {
        name: 'get_mouse_position',
        description: 'Get the current mouse cursor position',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_screen_size',
        description: 'Get the screen dimensions',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  }
})

// 도구 실행 핸들러
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  logToolCall(name, args)

  try {
    let result

    switch (name) {
      // 마우스 제어
      case 'mouse_move': {
        const { x, y } = args
        validateCoordinates(x, y)
        robot.moveMouse(x, y)
        result = { message: `Mouse moved to (${x}, ${y})` }
        break
      }

      case 'mouse_click': {
        const button = args.button || 'left'
        const double = args.double || false

        if (!['left', 'right', 'middle'].includes(button)) {
          throw new Error(`Invalid button: ${button}. Must be left, right, or middle.`)
        }

        robot.mouseClick(button, double)
        result = { message: `Mouse ${double ? 'double-' : ''}clicked with ${button} button` }
        break
      }

      case 'mouse_drag': {
        const { x, y } = args
        validateCoordinates(x, y)
        robot.dragMouse(x, y)
        result = { message: `Mouse dragged to (${x}, ${y})` }
        break
      }

      case 'mouse_drag_drop': {
        const { fromX, fromY, toX, toY, duration = 500 } = args
        validateCoordinates(fromX, fromY)
        validateCoordinates(toX, toY)

        // 시작 위치로 이동
        robot.moveMouse(fromX, fromY)
        robot.mouseToggle('down')

        // 애니메이션으로 드래그
        const steps = 20
        const stepDelay = duration / steps

        for (let i = 1; i <= steps; i++) {
          const currentX = fromX + ((toX - fromX) * i) / steps
          const currentY = fromY + ((toY - fromY) * i) / steps
          robot.moveMouse(currentX, currentY)
          await new Promise((resolve) => setTimeout(resolve, stepDelay))
        }

        robot.mouseToggle('up')
        result = { message: `Drag-and-drop from (${fromX}, ${fromY}) to (${toX}, ${toY})` }
        break
      }

      // 키보드 제어
      case 'keyboard_type': {
        const { text } = args

        if (!text || typeof text !== 'string') {
          throw new Error('Text must be a non-empty string')
        }

        robot.typeString(text)
        result = { message: `Typed: "${text}"` }
        break
      }

      case 'keyboard_press': {
        const { key, modifiers = [] } = args

        if (!key || typeof key !== 'string') {
          throw new Error('Key must be a non-empty string')
        }

        if (modifiers.length > 0) {
          robot.keyTap(key, modifiers)
        } else {
          robot.keyTap(key)
        }

        const modStr = modifiers.length > 0 ? modifiers.join('+') + '+' : ''
        result = { message: `Pressed key: ${modStr}${key}` }
        break
      }

      // 스크린샷
      case 'take_screenshot': {
        const { filename } = args

        if (filename) {
          // 파일로 저장
          validateFilePath(filename)
          const filepath = path.resolve(filename)
          // -x: 소리 없음
          await execAsync(`screencapture -x "${filepath}"`)
          result = { message: `Screenshot saved to ${filepath}`, path: filepath }
        } else {
          // 클립보드로 복사
          // -c: 클립보드로 저장
          await execAsync('screencapture -c')
          result = { message: 'Screenshot copied to clipboard' }
        }
        break
      }

      // 클립보드 제어
      case 'clipboard_get': {
        const text = clipboardy.readSync()
        result = { content: text }
        break
      }

      case 'clipboard_set': {
        const { text } = args

        if (typeof text !== 'string') {
          throw new Error('Text must be a string')
        }

        clipboardy.writeSync(text)
        result = { message: `Clipboard set to: "${text}"` }
        break
      }

      case 'clipboard_paste': {
        robot.keyTap('v', ['command'])
        result = { message: 'Pasted clipboard content (Command+V)' }
        break
      }

      // 유틸리티
      case 'get_mouse_position': {
        const pos = robot.getMousePos()
        result = { position: { x: pos.x, y: pos.y } }
        break
      }

      case 'get_screen_size': {
        const size = robot.getScreenSize()
        result = { size: { width: size.width, height: size.height } }
        break
      }

      // 마우스 스크롤 (v2.1)
      case 'mouse_scroll': {
        const { direction, amount = 5 } = args

        if (!['up', 'down', 'left', 'right'].includes(direction)) {
          throw new Error(`Invalid direction: ${direction}`)
        }

        // robotjs.scrollMouse(x, y) - x is horizontal, y is vertical
        // positive y = scroll down, negative y = scroll up
        // positive x = scroll right, negative x = scroll left
        let x = 0
        let y = 0

        switch (direction) {
          case 'up':
            y = -amount
            break
          case 'down':
            y = amount
            break
          case 'left':
            x = -amount
            break
          case 'right':
            x = amount
            break
        }

        robot.scrollMouse(x, y)
        result = { message: `Scrolled ${direction} by ${amount}` }
        break
      }

      // 다중 포인트 경로 (v2.1)
      case 'mouse_move_path': {
        const { points, duration = 1000 } = args

        if (!Array.isArray(points) || points.length < 2) {
          throw new Error('Path must have at least 2 points')
        }

        // 모든 포인트 검증
        for (const point of points) {
          validateCoordinates(point.x, point.y)
        }

        // 총 경로 길이 계산
        let totalDistance = 0
        for (let i = 0; i < points.length - 1; i++) {
          const dx = points[i + 1].x - points[i].x
          const dy = points[i + 1].y - points[i].y
          totalDistance += Math.sqrt(dx * dx + dy * dy)
        }

        // 스텝 수 계산 (거리에 비례, 최소 20)
        const steps = Math.max(20, Math.floor(totalDistance / 10))
        const stepDelay = duration / steps

        // 경로를 따라 부드럽게 이동
        let currentStep = 0
        for (let i = 0; i < points.length - 1; i++) {
          const startPoint = points[i]
          const endPoint = points[i + 1]

          const dx = endPoint.x - startPoint.x
          const dy = endPoint.y - startPoint.y
          const segmentDistance = Math.sqrt(dx * dx + dy * dy)
          const segmentSteps = Math.floor((segmentDistance / totalDistance) * steps)

          for (let s = 0; s <= segmentSteps; s++) {
            const t = s / segmentSteps
            const currentX = startPoint.x + dx * t
            const currentY = startPoint.y + dy * t
            robot.moveMouse(currentX, currentY)
            await new Promise((resolve) => setTimeout(resolve, stepDelay))
          }
        }

        result = { message: `Moved through ${points.length} points in ${duration}ms` }
        break
      }

      // 윈도우 관리 (v2.1)
      case 'window_list': {
        const script = `
          tell application "System Events"
            set windowList to {}
            set allProcesses to every process whose background only is false
            repeat with proc in allProcesses
              set procName to name of proc
              try
                set windowNames to name of every window of proc
                repeat with winName in windowNames
                  set end of windowList to procName & " - " & winName
                end repeat
              end try
            end repeat
            return windowList
          end tell
        `

        const output = await runAppleScript(script)
        const windows = output ? output.split(', ').filter(w => w.trim()) : []
        result = { windows }
        break
      }

      case 'window_get_active': {
        const activeWindow = await activeWin()
        if (activeWindow) {
          result = {
            title: activeWindow.title,
            owner: activeWindow.owner.name,
            bounds: activeWindow.bounds,
          }
        } else {
          result = { message: 'No active window found' }
        }
        break
      }

      case 'window_focus': {
        const { appName } = args

        if (!appName || typeof appName !== 'string') {
          throw new Error('App name must be a non-empty string')
        }

        const script = `tell application "${appName}" to activate`
        await runAppleScript(script)
        result = { message: `Focused application: ${appName}` }
        break
      }

      default:
        throw new Error(`Unknown tool: ${name}`)
    }

    logToolSuccess(name, result)

    return {
      content: [
        {
          type: 'text',
          text: result.message || JSON.stringify(result),
        },
      ],
    }
  } catch (error) {
    logToolError(name, error)

    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    }
  }
})

// 서버 시작
async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('MacOS Control MCP Server v2.0 running on stdio')
}

main().catch((error) => {
  console.error('Server error:', error)
  process.exit(1)
})
