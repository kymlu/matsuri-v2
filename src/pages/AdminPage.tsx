import React, { useEffect, useMemo, useRef, useState } from "react";
import { IconLabelButton } from "../components/basic/Button";
import { User } from "../models/user";
import IconButton from "../components/basic/IconButton";
import { Dialog } from "@base-ui/react";
import ConfirmDeletionDialog from "../components/dialogs/ConfirmDeletionDialog";
import { isNullOrUndefinedOrBlank, strCompare, strEquals } from "../lib/helpers/globalHelper";
import { Tag } from "../components/common/Tag";
import InviteUserDialog from "../components/dialogs/InviteUserDialog";
import { Team } from "../models/team";
import EditUserRoleDialog from "../components/dialogs/EditUserRoleDialog";
import { getAllMembers, removeUserFromTeam } from "../lib/helpers/apiHelper";

type AdminPageProps = {
  goToHomePage: () => void,
  team: Team,
  currentUserId: string,
}

export default function AdminPage({
  goToHomePage, team, currentUserId
}: AdminPageProps) {
  const [users, setUsers] = useState<User[]>([]);
  const inviteUserDialogActionRef = useRef<Dialog.Root.Actions | null>(null);

  const loadData = async () => {
    try {
      const result = await getAllMembers(team.id);
      setUsers(result
        .sort((a, b) => strCompare<User>(a, b, "email"))
        .sort((a, b) => strCompare<User>(a, b, "name")));
    } catch (e: any) {
      // todo: add error dialog
    }
  }

  useEffect(() => {
    loadData()
  }, []);

  const existingEmails = useMemo(() => {
    return new Set(users.map(u => u.email));
  }, [users]);

  const deleteUser = (id: string) => {
    try {
      removeUserFromTeam(id, team.id, () => {loadData()}, () => {loadData()});
    } catch (e) {
      // todo: error handling
      loadData();
    }
  }
  
  return <div className="w-full px-4 grid grid-rows-[auto,1fr] py-10 gap-4 text-center overflow-hide bg-gray-50 h-[100svh]">
    <header className="flex items-center gap-2">
      <IconButton
        src="home"
        noBorder
        onClick={() => {
          goToHomePage();
        }}/>
      <div className="flex-1 text-start">
        <div className="text-sm text-primary">
          <b>{team.name}</b><span>の</span>
        </div>
        <h2 className='flex-1 text-2xl font-bold text-nowrap'>ユーザー管理</h2>
      </div>
      <Dialog.Root actionsRef={inviteUserDialogActionRef}>
        <Dialog.Trigger>
          <IconLabelButton icon="add" label="招待" primary asDiv/>
        </Dialog.Trigger>
        <InviteUserDialog
          teamName={team.name}
          teamId={team.id}
          existingUsers={existingEmails}
          onSuccess={() => {
            loadData();
          }}
          onClose={() => inviteUserDialogActionRef.current?.close()}
          />
      </Dialog.Root>
    </header>
    <div className="px-2 h-full grid auto-rows-min items-center overflow-y-auto w-full max-w-full gap-4 grid-cols-[1fr,auto,auto]">
      {
        users.map((user, i) => (
          <React.Fragment key={user.id}>
            <div className="text-start">
              {
                !isNullOrUndefinedOrBlank(user.name) &&
                <p className="font-semibold break-all">{user.name}</p>
              }
              <p className="text-sm text-gray-600 break-all">{user.email}</p>
            </div>
            {
              user.role === "admin" &&
              <Tag type="filled" text="管理者"/>
            }
            {
              user.role === "editor" &&
              <Tag type="grey" text="編集者"/>
            }
            <div className="flex justify-end gap-2">
              <Dialog.Root>
                <Dialog.Trigger disabled={strEquals(currentUserId, user.id)}>
                  <IconButton disabled={strEquals(currentUserId, user.id)} src="edit" colour="grey" noBorder asDiv/>
                </Dialog.Trigger>
                <EditUserRoleDialog teamId={team.id} teamName={team.name} user={user} onSuccess={() => {loadData()}}/>
              </Dialog.Root>
              <Dialog.Root>
                <Dialog.Trigger disabled={strEquals(currentUserId, user.id)}>
                  <IconButton disabled={strEquals(currentUserId, user.id)} src="delete" colour="primary" noBorder asDiv/>
                </Dialog.Trigger>
                <ConfirmDeletionDialog
                  name={!isNullOrUndefinedOrBlank(user.name) ? `${user.name} (${user.email})` : user.email}
                  onSubmit={() => deleteUser(user.id)}
                  verb="取り消"
                />
              </Dialog.Root>
            </div>
          </React.Fragment>
        ))
      }
    </div>
  </div>;
}