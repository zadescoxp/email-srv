# Email Service Microservice

A microservice for sending emails using RabbitMQ for reliable message processing and Resend API for email delivery.

## Features

- Queue-based architecture for reliable email processing
- Template-based emails using EJS
- Retry mechanism for failed email delivery
- Supports multiple email types (onboarding, invoice, receipt)
- Environment-based configuration

## Prerequisites

- Node.js (v16 or later)
- npm
- RabbitMQ server

## Installation

```bash
# Install dependencies
npm install
```

## Configuration

Create a `.env` file in the root directory with the following variables:

```
# RabbitMQ Configuration
RABBITMQ_URL=amqp://guest:guest@localhost:5672

# Email Service Configuration
PORT=3000
RESEND_API_KEY=your_resend_api_key
```

## Running the Service

The service consists of two components that should be run separately:

```bash
# Build the TypeScript code
npm run build

# In one terminal, run the API server
npm run dev:server

# In another terminal, run the email worker
npm run dev:worker

# Or run both concurrently in development mode
npm run dev
```

For production:

```bash
npm run build
npm start
node dist/workers/emailWorker.js
```

## API Usage

Send an email by making a POST request to the `/enqueue-email` endpoint:

```bash
curl -X POST http://localhost:3000/enqueue-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "recipient@example.com",
    "type": "onboarding",
    "data": {
      "name": "John Doe",
      "email": "johndoe@example.com"
    }
  }'
```

For Windows Command Prompt:

```
curl -X POST http://localhost:3000/enqueue-email -H "Content-Type: application/json" -d "{\"to\":\"recipient@example.com\",\"type\":\"onboarding\",\"data\":{\"name\":\"John Doe\",\"email\":\"johndoe@example.com\"}}"
```

For PowerShell:

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/enqueue-email" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"to":"recipient@example.com","type":"onboarding","data":{"name":"John Doe","email":"johndoe@example.com"}}'
```

## Email Templates

The service supports the following email templates:

- `onboarding.ejs`: Welcome email
- `invoice.ejs`: Invoice notification
- `receipt.ejs`: Payment receipt

## Architecture

- **API Server**: Express-based REST API
- **Queue**: RabbitMQ for reliable message processing
- **Worker**: Background process for email sending
- **Templates**: EJS-based email templates
