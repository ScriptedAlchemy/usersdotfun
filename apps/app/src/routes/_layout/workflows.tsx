import {
  createFileRoute,
  Link,
  Outlet,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import {
  Edit,
  Eye,
  FileText,
  List,
  Play,
  PlusCircle,
  Power,
  Workflow,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger
} from "~/components/ui/sidebar";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import {
  useRunWorkflowNowMutation,
  useToggleWorkflowStatusMutation,
  useWorkflowsQuery,
} from "~/lib/queries";
import { workflowStatusColors } from "~/lib/status-colors";

export const Route = createFileRoute("/_layout/workflows")({
  component: WorkflowsLayout,
});

function WorkflowsLayout() {
  const params = useParams({ strict: false });
  const navigate = useNavigate();
  const { data: workflows, isLoading } = useWorkflowsQuery();
  const runMutation = useRunWorkflowNowMutation();
  const toggleMutation = useToggleWorkflowStatusMutation();

  // Extract workflowId from any nested route
  const workflowId = (params as any).workflowId;

  const handleRunNow = async (workflowId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const promise = runMutation.mutateAsync(workflowId);
    toast.promise(promise, {
      loading: "Triggering workflow...",
      success: (data) => {
        navigate({
          to: "/workflows/$workflowId/runs/$runId",
          params: { workflowId, runId: data.id },
        });
        return "Workflow triggered successfully!";
      },
      error: "Failed to trigger workflow.",
    });
  };

  const handleToggle = async (workflowId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    toast.promise(toggleMutation.mutateAsync(workflowId), {
      loading: "Toggling status...",
      success: "Status toggled successfully!",
      error: "Failed to toggle status.",
    });
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-full w-full">
        <Sidebar
          variant="sidebar"
          collapsible="icon"
          className="border-r-2 border-border"
        >
          <SidebarHeader className="border-b-2 border-border">
            <div className="flex items-center justify-between px-2 py-2">
              <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
                <Workflow className="h-5 w-5 text-primary" />
                <span className="font-mono font-bold uppercase text-sm group-data-[collapsible=icon]:hidden">
                  Workflows
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 group-data-[collapsible=icon]:hidden"
                asChild
              >
                <Link to="/workflows/create">
                  <PlusCircle className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="font-mono uppercase text-xs text-muted-foreground">
                Available Workflows
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {isLoading ? (
                    <>
                      <SidebarMenuItem>
                        <Skeleton className="h-10 w-full" />
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <Skeleton className="h-10 w-full" />
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <Skeleton className="h-10 w-full" />
                      </SidebarMenuItem>
                    </>
                  ) : workflows && workflows.length > 0 ? (
                    workflows.map((workflow) => (
                      <SidebarMenuItem key={workflow.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <SidebarMenuButton
                              asChild
                              isActive={workflowId === workflow.id}
                              className="group"
                            >
                              <Link
                                to="/workflows/$workflowId"
                                params={{ workflowId: workflow.id }}
                                className="flex items-center justify-between"
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <Workflow className="h-4 w-4 text-primary shrink-0 group-data-[collapsible=icon]:mr-0" />
                                  <span className="font-mono text-xs truncate group-data-[collapsible=icon]:hidden">
                                    {workflow.name}
                                  </span>
                                  <Badge
                                    variant={
                                      workflowStatusColors[workflow.status]
                                    }
                                    className="text-[10px] px-1 py-0 h-4 group-data-[collapsible=icon]:hidden"
                                  >
                                    {workflow.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity group-data-[collapsible=icon]:hidden">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                    onClick={(e) =>
                                      handleToggle(workflow.id, e)
                                    }
                                    title="Toggle Status"
                                  >
                                    <Power className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                    onClick={(e) =>
                                      handleRunNow(workflow.id, e)
                                    }
                                    title="Run Now"
                                  >
                                    <Play className="h-3 w-3" />
                                  </Button>
                                </div>
                              </Link>
                            </SidebarMenuButton>
                          </TooltipTrigger>
                          <TooltipContent
                            side="right"
                            className="group-data-[collapsible=icon]:block hidden"
                          >
                            <div className="flex flex-col gap-1">
                              <span className="font-mono font-bold">
                                {workflow.name}
                              </span>
                              <Badge
                                variant={workflowStatusColors[workflow.status]}
                                className="text-[10px] px-1 py-0 h-4 w-fit"
                              >
                                {workflow.status}
                              </Badge>
                            </div>
                          </TooltipContent>
                        </Tooltip>

                        {workflowId === workflow.id && (
                          <SidebarMenuSub>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                asChild
                                isActive={window.location.pathname.includes(
                                  "/view"
                                )}
                              >
                                <Link
                                  to="/workflows/$workflowId/view"
                                  params={{ workflowId: workflow.id }}
                                  className="font-mono text-xs"
                                >
                                  <Eye className="h-3 w-3" />
                                  View
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>

                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                asChild
                                isActive={window.location.pathname.includes(
                                  "/edit"
                                )}
                              >
                                <Link
                                  to="/workflows/$workflowId/edit"
                                  params={{ workflowId: workflow.id }}
                                  className="font-mono text-xs"
                                >
                                  <Edit className="h-3 w-3" />
                                  Edit
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>

                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                asChild
                                isActive={window.location.pathname.includes(
                                  "/runs"
                                )}
                              >
                                <Link
                                  to="/workflows/$workflowId/runs"
                                  params={{ workflowId: workflow.id }}
                                  className="font-mono text-xs"
                                >
                                  <List className="h-3 w-3" />
                                  Runs
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>

                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                asChild
                                isActive={window.location.pathname.includes(
                                  "/items"
                                )}
                              >
                                <Link
                                  to="/workflows/$workflowId/items"
                                  params={{ workflowId: workflow.id }}
                                  className="font-mono text-xs"
                                >
                                  <FileText className="h-3 w-3" />
                                  Items
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          </SidebarMenuSub>
                        )}
                      </SidebarMenuItem>
                    ))
                  ) : (
                    <div className="px-2 py-4 text-center">
                      <p className="text-xs text-muted-foreground font-mono">
                        No workflows found
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        asChild
                      >
                        <Link to="/workflows/create">
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Create First Workflow
                        </Link>
                      </Button>
                    </div>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t-2 border-border">
            <div className="px-2 py-2 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:text-center">
              <p className="text-[10px] font-mono uppercase text-muted-foreground">
                <span className="group-data-[collapsible=icon]:hidden">
                  Total:{" "}
                </span>
                {workflows?.length || 0}
                <span className="group-data-[collapsible=icon]:hidden">
                  {" "}
                  workflows
                </span>
              </p>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1">
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-2 border-b-2 border-border px-4 py-2">
              <SidebarTrigger />
              <div className="flex-1" />
            </div>
            <div className="flex-1 overflow-auto p-4">
              <Outlet />
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
