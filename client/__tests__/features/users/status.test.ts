import { describe, expect, it } from "vitest";
import {
  getUserActionLabel,
  getUserStatus,
  getUserStatusLabel,
  isInvitationPending,
} from "@/features/users/status";

describe("getUserStatus", () => {
  it("marks confirmed or signed-in users as active", () => {
    expect(
      getUserStatus({
        email_confirmed_at: "2026-03-30T10:00:00Z",
        invited_at: "2026-03-29T10:00:00Z",
      })
    ).toBe("active");

    expect(
      getUserStatus({
        last_sign_in_at: "2026-03-30T12:00:00Z",
      })
    ).toBe("active");
  });

  it("marks invited users without confirmed access as invited", () => {
    expect(
      getUserStatus({
        invited_at: "2026-03-29T10:00:00Z",
      })
    ).toBe("invited");
  });

  it("falls back to pending when there is no activation signal", () => {
    expect(getUserStatus({})).toBe("pending");
  });
});

describe("user status labels", () => {
  it("returns the right action and invitation flag", () => {
    expect(getUserStatusLabel("active")).toBe("Actif");
    expect(getUserActionLabel("active")).toBe("Reset mdp");
    expect(isInvitationPending("active")).toBe(false);

    expect(getUserStatusLabel("invited")).toBe("Invitation en attente");
    expect(getUserActionLabel("invited")).toBe("Renvoyer invite");
    expect(isInvitationPending("invited")).toBe(true);
  });
});
