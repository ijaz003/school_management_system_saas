CREATE TABLE "diary_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"entry_date" date NOT NULL,
	"class_id" uuid NOT NULL,
	"section_id" uuid,
	"title" varchar(200) NOT NULL,
	"homework" text NOT NULL,
	"classwork" text,
	"remarks" text,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"published_at" timestamp,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "diary_entries" ADD CONSTRAINT "diary_entries_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diary_entries" ADD CONSTRAINT "diary_entries_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diary_entries" ADD CONSTRAINT "diary_entries_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diary_entries" ADD CONSTRAINT "diary_entries_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "diary_entries_tenant_date_idx" ON "diary_entries" USING btree ("tenant_id","entry_date");--> statement-breakpoint
CREATE INDEX "diary_entries_tenant_class_idx" ON "diary_entries" USING btree ("tenant_id","class_id");--> statement-breakpoint
CREATE INDEX "diary_entries_status_idx" ON "diary_entries" USING btree ("tenant_id","status");