ALTER TABLE "pipeline_step" RENAME TO "plugin_run";--> statement-breakpoint
ALTER TABLE "plugin_run" DROP CONSTRAINT "pipeline_step_workflow_run_id_workflow_run_id_fk";
--> statement-breakpoint
ALTER TABLE "plugin_run" DROP CONSTRAINT "pipeline_step_source_item_id_source_item_id_fk";
--> statement-breakpoint
ALTER TABLE "plugin_run" ADD CONSTRAINT "plugin_run_workflow_run_id_workflow_run_id_fk" FOREIGN KEY ("workflow_run_id") REFERENCES "public"."workflow_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plugin_run" ADD CONSTRAINT "plugin_run_source_item_id_source_item_id_fk" FOREIGN KEY ("source_item_id") REFERENCES "public"."source_item"("id") ON DELETE cascade ON UPDATE no action;