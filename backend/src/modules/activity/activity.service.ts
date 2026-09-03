import { prisma } from "../../lib/prisma";
import { RequestUser } from "../../types/index";

export const activityService = {
  async getAll(user: RequestUser, date?: string, startDate?: string, endDate?: string) {
    const where: Record<string, any> =
      user.role === "WORKER"
        ? { workerId: user.id }
        : {};

    if (date && date !== "all") {
      const start = new Date(`${date}T00:00:00`);
      const end = new Date(`${date}T23:59:59.999`);
      where.createdAt = {
        gte: isNaN(start.getTime()) ? undefined : start,
        lte: isNaN(end.getTime()) ? undefined : end,
      };
    } else if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) {
        const start = new Date(`${startDate}T00:00:00`);
        if (!isNaN(start.getTime())) dateFilter.gte = start;
      }
      if (endDate) {
        const end = new Date(`${endDate}T23:59:59.999`);
        if (!isNaN(end.getTime())) dateFilter.lte = end;
      }
      if (Object.keys(dateFilter).length > 0) {
        where.createdAt = dateFilter;
      }
    }

    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return logs;
  },
};

