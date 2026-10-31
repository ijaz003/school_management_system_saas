CREATE TABLE "students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"admission_no" varchar(50) NOT NULL,
	"full_name" varchar(200) NOT NULL,
	"gender" varchar(20) NOT NULL,
	"date_of_birth" date NOT NULL,
	"blood_group" varchar(10),
	"phone" varchar(20),
	"email" varchar(255),
	"address" text,
	"class_id" uuid NOT NULL,
	"section_id" uuid NOT NULL,
	"guardian_name" varchar(200) NOT NULL,
	"guardian_phone" varchar(20) NOT NULL,
	"guardian_email" varchar(255),
	"guardian_relation" varchar(50),
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"admission_date" date NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "students_tenant_idx" ON "students" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "students_class_idx" ON "students" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "students_section_idx" ON "students" USING btree ("section_id");--> statement-breakpoint
CREATE INDEX "students_status_idx" ON "students" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "students_tenant_admission_no_idx" ON "students" USING btree ("tenant_id","admission_no") WHERE deleted_at IS NULL;