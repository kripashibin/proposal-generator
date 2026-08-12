import Image from "next/image";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { requireCurrentOrg } from "@/lib/auth/current-org";
import { createClient } from "@/lib/supabase/server";
import type { TeamMember } from "@/lib/proposal/types";
import { addTeamMember, deleteTeamMember, updateOrganization, uploadLogo } from "./actions";

export default async function SettingsPage() {
  const { organization } = await requireCurrentOrg();
  const supabase = await createClient();
  const { data: teamMembers } = await supabase
    .from("team_members")
    .select("*")
    .eq("org_id", organization.id)
    .order("sort_order", { ascending: true });

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Company details and team members used as defaults across proposals.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company profile</CardTitle>
          <CardDescription>
            Shown in the header/footer and cover page of every proposal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-md border bg-muted">
              {organization.logo_url ? (
                <Image
                  src={organization.logo_url}
                  alt="Company logo"
                  width={64}
                  height={64}
                  className="h-full w-full object-contain"
                  unoptimized
                />
              ) : (
                <span className="text-xs text-muted-foreground">No logo</span>
              )}
            </div>
            <form action={uploadLogo} className="flex items-center gap-2">
              <Input type="file" name="logo" accept="image/*" required className="max-w-xs" />
              <Button type="submit" variant="secondary" size="sm">
                Upload
              </Button>
            </form>
          </div>

          <form action={updateOrganization} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Company name</Label>
                <Input id="name" name="name" defaultValue={organization.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_email">Contact email</Label>
                <Input
                  id="contact_email"
                  name="contact_email"
                  type="email"
                  defaultValue={organization.contact_email ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Contact phone</Label>
                <Input
                  id="contact_phone"
                  name="contact_phone"
                  defaultValue={organization.contact_phone ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduling_link">Scheduling link</Label>
                <Input
                  id="scheduling_link"
                  name="scheduling_link"
                  placeholder="https://cal.com/you"
                  defaultValue={organization.scheduling_link ?? ""}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_address">Address</Label>
              <Textarea
                id="contact_address"
                name="contact_address"
                rows={2}
                defaultValue={organization.contact_address ?? ""}
              />
            </div>
            <Button type="submit">Save changes</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team members</CardTitle>
          <CardDescription>
            Default team shown on the &ldquo;Who will work with you&rdquo; section — editable per proposal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(teamMembers ?? []).map((member: TeamMember) => (
            <div key={member.id} className="flex items-start justify-between gap-4 rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">
                  {member.name}
                  {member.role ? (
                    <span className="text-muted-foreground"> — {member.role}</span>
                  ) : null}
                </p>
                {member.description ? (
                  <p className="mt-1 text-sm text-muted-foreground">{member.description}</p>
                ) : null}
              </div>
              <form action={deleteTeamMember}>
                <input type="hidden" name="id" value={member.id} />
                <Button variant="ghost" size="icon" type="submit">
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </form>
            </div>
          ))}

          <Separator />

          <form action={addTeamMember} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="member-name">Name</Label>
                <Input id="member-name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="member-role">Role</Label>
                <Input id="member-role" name="role" placeholder="Solution Lead" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-description">Bio</Label>
              <Textarea id="member-description" name="description" rows={2} />
            </div>
            <Button type="submit" variant="secondary" size="sm">
              Add team member
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
