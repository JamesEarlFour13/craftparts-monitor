CREATE TABLE "app_settings" (
	"key" varchar(255) PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp DEFAULT now()
);

INSERT INTO "app_settings" ("key", "value") VALUES ('notifications_enabled', 'true');
