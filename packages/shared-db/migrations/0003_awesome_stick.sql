CREATE TABLE "workflows_to_source_items" (
	"workflow_id" varchar(255) NOT NULL,
	"source_item_id" varchar(255) NOT NULL,
	CONSTRAINT "workflows_to_source_items_workflow_id_source_item_id_pk" PRIMARY KEY("workflow_id","source_item_id")
);
--> statement-breakpoint
ALTER TABLE "source_item" DROP CONSTRAINT "source_item_workflow_id_workflow_id_fk";
--> statement-breakpoint
ALTER TABLE "source_item" ADD COLUMN "external_id" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "source_item" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "workflows_to_source_items" ADD CONSTRAINT "workflows_to_source_items_workflow_id_workflow_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflow"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflows_to_source_items" ADD CONSTRAINT "workflows_to_source_items_source_item_id_source_item_id_fk" FOREIGN KEY ("source_item_id") REFERENCES "public"."source_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "external_id_idx" ON "source_item" USING btree ("external_id");--> statement-breakpoint
ALTER TABLE "source_item" DROP COLUMN "workflow_id";--> statement-breakpoint
ALTER TABLE "source_item" ADD CONSTRAINT "source_item_external_id_unique" UNIQUE("external_id");