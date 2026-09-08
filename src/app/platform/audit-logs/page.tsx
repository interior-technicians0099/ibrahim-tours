import React from 'react';
import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import AuditLogsClient, { AuditLogItem } from '@/components/platform/AuditLogsClient';

export default async function PlatformAuditLogsPage() {
  await requireRole(Role.PLATFORM_ADMIN);

  const rawLogs = await prisma.auditLog.findMany({
    include: {
      user: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 150,
  });

  const formattedLogs: AuditLogItem[] = rawLogs.map((log: any) => ({
    id: log.id,
    userId: log.userId,
    userName: log.user?.name || log.user?.email || 'System Operation',
    userRole: log.user?.role,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    details: log.details,
    ipAddress: log.ipAddress,
    createdAt: new Date(log.createdAt).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
  }));

  return <AuditLogsClient initialLogs={formattedLogs} />;
}
