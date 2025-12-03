const winston = require('winston')
const path = require('path')
const fs = require('fs')

// 로그 디렉토리 생성
const logDir = path.join(__dirname, 'logs')
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir)
}

// Winston 로거 설정
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.printf(({ timestamp, level, message, stack, tool, args, result }) => {
            let log = `[${timestamp}] [${level.toUpperCase()}]`

            if (tool) {
                log += ` Tool: ${tool}`
            }

            if (args) {
                log += ` - Args: ${JSON.stringify(args)}`
            }

            log += ` - ${message}`

            if (result) {
                log += ` - Result: ${JSON.stringify(result)}`
            }

            if (stack) {
                log += `\n${stack}`
            }

            return log
        })
    ),
    transports: [
        // 콘솔 출력 (에러만)
        new winston.transports.Console({
            level: 'error',
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            ),
        }),
        // 모든 로그
        new winston.transports.File({
            filename: path.join(logDir, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        // 에러 로그만
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
    ],
})

// 로그 헬퍼 함수
const logToolCall = (toolName, args) => {
    logger.info('Tool invoked', { tool: toolName, args })
}

const logToolSuccess = (toolName, result) => {
    logger.info('Tool succeeded', { tool: toolName, result })
}

const logToolError = (toolName, error) => {
    logger.error('Tool failed', {
        tool: toolName,
        message: error.message,
        stack: error.stack,
    })
}

module.exports = {
    logger,
    logToolCall,
    logToolSuccess,
    logToolError,
}
