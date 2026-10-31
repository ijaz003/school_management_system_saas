CREATE TABLE "exam_marks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"exam_subject_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"marks_obtained" integer,
	"is_absent" boolean DEFAULT false NOT NULL,
	"remarks" text,
	"entered_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_subjects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"exam_id" uuid NOT NULL,
	"subject_id" uuid NOT NULL,
	"max_marks" integer NOT NULL,
	"pass_marks" integer NOT NULL,
	"exam_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(150) NOT NULL,
	"class_id" uuid NOT NULL,
	"term" varchar(50),
	"academic_year" varchar(20),
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"published_at" timestamp,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "exam_marks" ADD CONSTRAINT "exam_marks_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_marks" ADD CONSTRAINT "exam_marks_exam_subject_id_exam_subjects_id_fk" FOREIGN KEY ("exam_subject_id") REFERENCES "public"."exam_subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_marks" ADD CONSTRAINT "exam_marks_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_marks" ADD CONSTRAINT "exam_marks_entered_by_users_id_fk" FOREIGN KEY ("entered_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_subjects" ADD CONSTRAINT "exam_subjects_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_subjects" ADD CONSTRAINT "exam_subjects_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_subjects" ADD CONSTRAINT "exam_subjects_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "exam_marks_tenant_idx" ON "exam_marks" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "exam_marks_exam_subject_idx" ON "exam_marks" USING btree ("exam_subject_id");--> statement-breakpoint
CREATE UNIQUE INDEX "exam_marks_unique_idx" ON "exam_marks" USING btree ("exam_subject_id","student_id");--> statement-breakpoint
CREATE INDEX "exam_subjects_tenant_idx" ON "exam_subjects" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "exam_subjects_exam_idx" ON "exam_subjects" USING btree ("exam_id");--> statement-breakpoint
CREATE UNIQUE INDEX "exam_subjects_unique_idx" ON "exam_subjects" USING btree ("exam_id","subject_id");--> statement-breakpoint
CREATE INDEX "exams_tenant_idx" ON "exams" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "exams_class_idx" ON "exams" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "exams_status_idx" ON "exams" USING btree ("tenant_id","status");