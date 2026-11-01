CREATE TABLE "expense_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"category_id" uuid,
	"title" varchar(200) NOT NULL,
	"amount" integer NOT NULL,
	"expense_date" date NOT NULL,
	"payment_method" varchar(30) DEFAULT 'cash' NOT NULL,
	"vendor" varchar(150),
	"reference" varchar(100),
	"notes" text,
	"status" varchar(20) DEFAULT 'recorded' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "expense_categories" ADD CONSTRAINT "expense_categories_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_category_id_expense_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."expense_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "expense_categories_tenant_idx" ON "expense_categories" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "expense_categories_name_idx" ON "expense_categories" USING btree ("tenant_id","name");--> statement-breakpoint
CREATE INDEX "expenses_tenant_idx" ON "expenses" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "expenses_category_idx" ON "expenses" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "expenses_date_idx" ON "expenses" USING btree ("tenant_id","expense_date");--> statement-breakpoint
CREATE INDEX "expenses_status_idx" ON "expenses" USING btree ("tenant_id","status");