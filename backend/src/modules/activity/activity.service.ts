import { prisma } from "../../lib/prisma";
import { RequestUser } from "../../types/index";

export const activityService = {
  async getAll(user: RequestUser, date?: string) {
    const where =
      user.role === "WORKER"
        ? { workerId: user.id }
        : {};

    const logs = await prisma.activityLog.findMany({
      where: date
        ? {
            ...where,
            createdAt: {
              gte: new Date(`${date}T00:00:00.000Z`),
              lte: new Date(`${date}T23:59:59.999Z`),
            },
          }
        : where,
      orderBy: { createdAt: "desc" },
    });

    return logs;
  },
};
