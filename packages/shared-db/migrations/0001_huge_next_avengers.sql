CREATE TYPE "public"."plugin_run_type" AS ENUM('SOURCE', 'PIPELINE');--> statement-breakpoint
CREATE TABLE "workflow_runs_to_source_items" (
	"workflow_run_id" varchar(255) NOT NULL,
	"source_item_id" varchar(255) NOT NULL,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workflow_runs_to_source_items_workflow_run_id_source_item_id_pk" PRIMARY KEY("workflow_run_id","source_item_id")
);
--> statement-breakpoint
ALTER TABLE "plugin_run" ADD COLUMN "type" "plugin_run_type" DEFAULT 'PIPELINE' NOT NULL;--> statement-breakpoint
ALTER TABLE "plugin_run" ADD COLUMN "retry_count" varchar(10) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "workflow_runs_to_source_items" ADD CONSTRAINT "workflow_runs_to_source_items_workflow_run_id_workflow_run_id_fk" FOREIGN KEY ("workflow_run_id") REFERENCES "public"."workflow_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_runs_to_source_items" ADD CONSTRAINT "workflow_runs_to_source_items_source_item_id_source_item_id_fk" FOREIGN KEY ("source_item_id") REFERENCES "public"."source_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "workflow_run_workflow_idx" ON "workflow_run" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "workflow_run_status_idx" ON "workflow_run" USING btree ("status");--> statement-breakpoint
CREATE INDEX "workflow_run_started_at_idx" ON "workflow_run" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "source_item_created_at_idx" ON "source_item" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "source_item_processed_at_idx" ON "source_item" USING btree ("processed_at");--> statement-breakpoint
CREATE INDEX "plugin_run_workflow_run_idx" ON "plugin_run" USING btree ("workflow_run_id");--> statement-breakpoint
CREATE INDEX "plugin_run_source_item_idx" ON "plugin_run" USING btree ("source_item_id");--> statement-breakpoint
CREATE INDEX "plugin_run_step_idx" ON "plugin_run" USING btree ("step_id");--> statement-breakpoint
CREATE INDEX "plugin_run_type_idx" ON "plugin_run" USING btree ("type");