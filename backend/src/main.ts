import { startTracing } from "./otel/tracing";

startTracing();

import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import * as express from "express";
import { AppModule } from "./app.module";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { QueueService } from "@/shared/queue/queue.service";
import { QUEUE_NAMES } from "@/shared/queue/interfaces/queue.interface";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    bodyParser: false,
  });

  const captureRawBody = (req: any, _res: any, buf: Buffer) => {
    req.rawBody = buf;
  };

  app.use(express.json({ limit: "50mb", verify: captureRawBody }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  if (process.env.NODE_ENV === "production") {
    app.getHttpAdapter().getInstance().set("trust proxy", true);
  }

  app.setGlobalPrefix("api/v2", {
    exclude: [
      "",
      "health",
      "metrics",
      "version",
      "admin/queues",
      "admin/queues/*path",
    ],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
      stopAtFirstError: false,
    }),
  );

  const corsOrigin = process.env.CORS_ORIGIN || "*";
  app.enableCors({
    origin:
      corsOrigin === "*" ? true : corsOrigin.split(",").map((o) => o.trim()),
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle("TelemetryFlow Core API")
    .setDescription(
      "TelemetryFlow Core — IAM, AI Assistant & Audit REST API v2\n\n" +
        "Covers IAM (Users, Roles, Permissions, Tenants, Organizations, Workspaces, Groups, Regions), " +
        "AI Assistant (LLM Chat, Providers, Insights), Audit Logging, " +
        "API Keys, SSO, Data Masking, Notifications.\n\n" +
        "**Default Users:**\n" +
        "- Super Admin: superadmin.telemetryflow@telemetryflow.id / SuperAdmin@654123\n" +
        "- Administrator: administrator.telemetryflow@telemetryflow.id / Admin@654123\n" +
        "- Developer: developer.telemetryflow@telemetryflow.id / Developer@654123\n" +
        "- Viewer: viewer.telemetryflow@telemetryflow.id / Viewer@654123\n" +
        "- Demo: demo.telemetryflow@telemetryflow.id / Demo@654123",
    )
    .setVersion("2.0.0")
    .addBearerAuth({
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
      description: "Enter JWT token",
    })
    .addTag("auth", "Authentication operations")
    .addTag("iam-users", "User management operations")
    .addTag("iam-roles", "Role management operations")
    .addTag("iam-permissions", "Permission management operations")
    .addTag("iam-tenants", "Tenant management operations")
    .addTag("iam-organizations", "Organization management operations")
    .addTag("iam-workspaces", "Workspace management operations")
    .addTag("iam-groups", "Group management operations")
    .addTag("iam-regions", "Region management operations")
    .addTag("iam-audit", "Audit log operations")
    .addTag("tenancy", "Tenancy provisioning operations")
    .addTag("api-keys", "API key management")
    .addTag("sso", "Single Sign-On configuration")
    .addTag("llm-chat", "AI Assistant chat")
    .addTag("llm-providers", "LLM provider configuration")
    .addTag("llm-insights", "AI insights")
    .addTag("data-masking", "Data masking rules")
    .addTag("notification", "Notification management")
    .addServer("http://localhost:3000", "Development")
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  });

  SwaggerModule.setup("api", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: "alpha",
      operationsSorter: "alpha",
    },
  });

  await app.init();
  const boardPath = "/admin/queues";
  const boardAdapter = new ExpressAdapter();
  boardAdapter.setBasePath(boardPath);
  const queueService = app.get(QueueService);
  createBullBoard({
    queues: Object.values(QUEUE_NAMES)
      .map((name) => queueService.getQueue(name))
      .filter(Boolean)
      .map((q) => new BullMQAdapter(q as any)),
    serverAdapter: boardAdapter,
  });
  app.use(boardPath, boardAdapter.getRouter());

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`Application running on: http://localhost:${port}`);
  console.log(`Swagger UI: http://localhost:${port}/api`);
  console.log(
    `OpenTelemetry: ${process.env.OTEL_ENABLED === "true" ? "Enabled" : "Disabled"}`,
  );

  process.on("SIGTERM", async () => {
    console.warn("SIGTERM signal received: closing HTTP server");
    await app.close();
  });

  process.on("SIGINT", async () => {
    console.warn("SIGINT signal received: closing HTTP server");
    await app.close();
  });
}

bootstrap().catch((err) => {
  console.error("[Bootstrap] Failed to start application:", err);
  process.exit(1);
});
