ALTER TABLE "exams" ADD COLUMN "section_id" uuid;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "exams_section_idx" ON "exams" USING btree ("section_id");