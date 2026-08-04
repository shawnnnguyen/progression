ALTER TABLE "TicketLabel" DROP CONSTRAINT "TicketLabel_labelId_fkey";

ALTER TABLE "TicketLabel" ADD CONSTRAINT "TicketLabel_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "Label"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
