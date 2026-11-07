ALTER TABLE "fee_structures" ADD COLUMN "section_id" uuid;--> statement-breakpoint
ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fee_structures_section_idx" ON "fee_structures" USING btree ("section_id");