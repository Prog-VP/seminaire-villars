export type UserStatus = "active" | "invited" | "pending";

type UserStatusSource = {
  invited_at?: string | null;
  email_confirmed_at?: string | null;
  confirmed_at?: string | null;
  last_sign_in_at?: string | null;
};

export function getUserStatus(user: UserStatusSource): UserStatus {
  if (user.last_sign_in_at || user.email_confirmed_at || user.confirmed_at) {
    return "active";
  }

  if (user.invited_at) {
    return "invited";
  }

  return "pending";
}

export function getUserStatusLabel(status: UserStatus) {
  switch (status) {
    case "active":
      return "Actif";
    case "invited":
      return "Invitation en attente";
    case "pending":
      return "Accès à finaliser";
  }
}

export function getUserStatusClassName(status: UserStatus) {
  switch (status) {
    case "active":
      return "bg-emerald-50 text-emerald-700";
    case "invited":
      return "bg-amber-50 text-amber-700";
    case "pending":
      return "bg-slate-100 text-slate-700";
  }
}

export function getUserActionLabel(status: UserStatus) {
  return status === "active" ? "Reset mdp" : "Renvoyer invite";
}

export function isInvitationPending(status: UserStatus) {
  return status === "invited" || status === "pending";
}
