import { loadDb } from './db.js';

export function userHasPermission(userId: number, role: string, permissionCode: string): boolean {
  const db = loadDb();
  const now = new Date().toISOString();

  // 1. Check for revoke override
  const revoke = db.user_permission_overrides?.find(o => 
    o.user_id === userId && o.permission === permissionCode && !o.access_type && (!o.expires_at || o.expires_at > now)
  );
  if (revoke) return false;

  // 2. Check for temp access
  const temp = db.temporary_access?.find(t => 
    t.user_id === userId && t.permission === permissionCode && !t.is_revoked && t.valid_from <= now && t.valid_until >= now
  );
  if (temp) return true;

  // 3. Check for grant override
  const grant = db.user_permission_overrides?.find(o => 
    o.user_id === userId && o.permission === permissionCode && o.access_type && (!o.expires_at || o.expires_at > now)
  );
  if (grant) return true;

  // 4. Check role
  const rolePerm = db.role_permissions?.find(rp => rp.role === role && rp.permission === permissionCode);
  return !!rolePerm;
}

export function getAccessType(userId: number, role: string, permissionCode: string): string | null {
  const db = loadDb();
  const now = new Date().toISOString();

  const override = db.user_permission_overrides?.find(o => 
    o.user_id === userId && o.permission === permissionCode && o.access_type && (!o.expires_at || o.expires_at > now)
  );
  if (override) return override.access_type;

  const temp = db.temporary_access?.find(t => 
    t.user_id === userId && t.permission === permissionCode && !t.is_revoked && t.valid_from <= now && t.valid_until >= now
  );
  if (temp) return temp.access_type;

  const rolePerm = db.role_permissions?.find(rp => rp.role === role && rp.permission === permissionCode);
  return rolePerm ? rolePerm.access_type : null;
}

export function logViolation(req: any, permissionCode: string) {
  const db = loadDb();
  if (!db.security_violations) db.security_violations = [];
  db.security_violations.push({
    id: db.security_violations.length + 1,
    user_id: req.sessionUser?.id || null,
    role: req.sessionUser?.role || null,
    ip_address: req.ip,
    method: req.method,
    endpoint: req.path,
    permission: permissionCode,
    user_agent: req.get('User-Agent') || '',
    occurred_at: new Date().toISOString()
  });
}

export const requirePermission = (permissionCode: string) => {
  return (req: any, res: any, next: any) => {
    if (!req.sessionUser) {
      return res.status(401).json({ error: 'unauthorized', code: 401 });
    }

    if (!userHasPermission(req.sessionUser.id, req.sessionUser.role, permissionCode)) {
      logViolation(req, permissionCode);
      return res.status(403).json({
        error: 'forbidden',
        message: `You don't have permission: ${permissionCode}`,
        code: 403
      });
    }

    req.accessType = getAccessType(req.sessionUser.id, req.sessionUser.role, permissionCode);
    next();
  };
};

export function filterForRole(req: any, queryResults: any[], entityOwnerField: string) {
  if (['full', 'read'].includes(req.accessType || 'full')) {
    return queryResults;
  }
  const ownerId = req.sessionUser?.vendor_id || req.sessionUser?.id;
  return queryResults.filter(r => r[entityOwnerField] === ownerId);
}

export function assertOwns(req: any, record: any, ownerField: string) {
  if (['full', 'read'].includes(req.accessType || 'full')) return;
  const ownerId = req.sessionUser?.vendor_id || req.sessionUser?.id;
  if (record[ownerField] !== ownerId) {
    logViolation(req, 'ownership_violation');
    throw new Error('PermissionError: You do not own this record');
  }
}
