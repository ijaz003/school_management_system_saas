CREATE TABLE "session_years" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(50) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status" varchar(20) DEFAULT 'planned' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "student_placements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"session_year_id" uuid NOT NULL,
	"class_id" uuid NOT NULL,
	"section_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'enrolled' NOT NULL,
	"is_current" boolean DEFAULT true NOT NULL,
	"promoted_from_placement_id" uuid,
	"notes" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "session_years" ADD CONSTRAINT "session_years_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_placements" ADD CONSTRAINT "student_placements_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_placements" ADD CONSTRAINT "student_placements_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_placements" ADD CONSTRAINT "student_placements_session_year_id_session_years_id_fk" FOREIGN KEY ("session_year_id") REFERENCES "public"."session_years"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_placements" ADD CONSTRAINT "student_placements_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_placements" ADD CONSTRAINT "student_placements_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "session_years_tenant_idx" ON "session_years" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "session_years_tenant_name_idx" ON "session_years" USING btree ("tenant_id","name") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "session_years_tenant_status_idx" ON "session_years" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "student_placements_tenant_idx" ON "student_placements" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "student_placements_student_idx" ON "student_placements" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "student_placements_session_idx" ON "student_placements" USING btree ("session_year_id");--> statement-breakpoint
CREATE UNIQUE INDEX "student_placements_student_session_idx" ON "student_placements" USING btree ("student_id","session_year_id");--> statement-breakpoint
CREATE INDEX "student_placements_current_idx" ON "student_placements" USING btree ("tenant_id","is_current");