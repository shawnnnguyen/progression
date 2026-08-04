CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX ticket_title_trgm_idx ON "Ticket" USING GIN ("title" gin_trgm_ops);
CREATE INDEX ticket_description_trgm_idx ON "Ticket" USING GIN ("description" gin_trgm_ops);

CREATE UNIQUE INDEX workflow_state_one_default_per_project
  ON "WorkflowState" ("projectId") WHERE "isDefault" = true;

CREATE OR REPLACE FUNCTION check_ticket_sprint_project() RETURNS trigger AS $$
BEGIN
  IF NEW."sprintId" IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM "Sprint" WHERE "id" = NEW."sprintId" AND "projectId" = NEW."projectId"
    ) THEN
      RAISE EXCEPTION 'Ticket.sprintId % does not belong to Ticket.projectId %', NEW."sprintId", NEW."projectId";
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ticket_sprint_project_check
  BEFORE INSERT OR UPDATE OF "sprintId", "projectId" ON "Ticket"
  FOR EACH ROW EXECUTE FUNCTION check_ticket_sprint_project();

CREATE OR REPLACE FUNCTION check_ticket_label_project() RETURNS trigger AS $$
DECLARE
  ticket_project_id TEXT;
  label_project_id TEXT;
BEGIN
  SELECT "projectId" INTO ticket_project_id FROM "Ticket" WHERE "id" = NEW."ticketId";
  SELECT "projectId" INTO label_project_id FROM "Label" WHERE "id" = NEW."labelId";
  IF ticket_project_id IS DISTINCT FROM label_project_id THEN
    RAISE EXCEPTION 'TicketLabel ticketId % (project %) does not match labelId % (project %)',
      NEW."ticketId", ticket_project_id, NEW."labelId", label_project_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ticket_label_project_check
  BEFORE INSERT OR UPDATE ON "TicketLabel"
  FOR EACH ROW EXECUTE FUNCTION check_ticket_label_project();
