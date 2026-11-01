CREATE TABLE "parent_students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"parent_user_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "parent_students" ADD CONSTRAINT "parent_students_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_students" ADD CONSTRAINT "parent_students_parent_user_id_users_id_fk" FOREIGN KEY ("parent_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_students" ADD CONSTRAINT "parent_students_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "parent_students_tenant_idx" ON "parent_students" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "parent_students_parent_idx" ON "parent_students" USING btree ("parent_user_id");--> statement-breakpoint
CREATE INDEX "parent_students_student_idx" ON "parent_students" USING btree ("student_id");--> statement-breakpoint
CREATE UNIQUE INDEX "parent_students_unique_idx" ON "parent_students" USING btree ("parent_user_id","student_id") WHERE deleted_at IS NULL;