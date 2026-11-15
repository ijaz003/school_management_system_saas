CREATE TABLE "fee_structure_item_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"structure_item_id" uuid NOT NULL,
	"month" integer NOT NULL,
	"academic_year" varchar(50),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "fee_structure_item_schedules_month_check" CHECK ("fee_structure_item_schedules"."month" BETWEEN 1 AND 12)
);
--> statement-breakpoint
ALTER TABLE "fee_structure_items" ADD COLUMN "schedule_type" varchar(20) DEFAULT 'monthly' NOT NULL;--> statement-breakpoint
ALTER TABLE "fee_structure_item_schedules" ADD CONSTRAINT "fee_structure_item_schedules_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_structure_item_schedules" ADD CONSTRAINT "fee_structure_item_schedules_structure_item_id_fee_structure_items_id_fk" FOREIGN KEY ("structure_item_id") REFERENCES "public"."fee_structure_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fee_structure_item_schedules_item_idx" ON "fee_structure_item_schedules" USING btree ("tenant_id","structure_item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "fee_structure_item_schedules_unique_idx" ON "fee_structure_item_schedules" USING btree ("tenant_id","structure_item_id","month",coalesce("academic_year", ''));--> statement-breakpoint
ALTER TABLE "fee_structure_items" ADD CONSTRAINT "fee_structure_items_schedule_type_check" CHECK ("fee_structure_items"."schedule_type" IN ('monthly', 'specific_months', 'one_time'));