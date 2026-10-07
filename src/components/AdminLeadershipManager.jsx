import { useEffect, useState } from "react";
import { Camera, Plus, Save, Trash2, UserRound } from "lucide-react";
import {
  createLeadershipTeam,
  deleteLeadershipImage,
  deleteLeadershipTeam,
  deleteUnattachedTeamImage,
  getAdminLeadership,
  updateLeadershipTeam,
  uploadTeamImage,
} from "../services/adminService";
import adminStyles from "../pages/AdminPage.module.css";
import styles from "./AdminLeadershipManager.module.css";
import treeStyles from "./AdminLeadershipTree.module.css";

const blankPerson = () => ({
  name: "",
  role: "",
  image: "",
  bio: "",
});
const blankEmployee = () => ({ ...blankPerson(), children: [] });
const blankTeam = () => ({
  department: "",
  summary: "",
  owner: blankPerson(),
  members: [],
});
const cleanOwner = ({ name, role, image }) => ({ name, role, image });
const cleanPerson = ({ name, role, image, bio }) => ({
  name,
  role,
  image,
  bio,
});
const cleanEmployee = (employee) => ({
  ...cleanPerson(employee),
  children: (employee.children || []).map(cleanEmployee),
});
const payloadFor = (team) => ({
  department: team.department,
  summary: team.summary,
  owner: cleanOwner(team.owner),
  members: team.members.map(cleanEmployee),
});

const updateEmployee = (members, path, updater) => {
  const [index, ...rest] = path;
  return members.map((member, memberIndex) => {
    if (memberIndex !== index) return member;
    if (!rest.length) return updater(member);
    return {
      ...member,
      children: updateEmployee(member.children || [], rest, updater),
    };
  });
};

const getEmployee = (members, path) =>
  path.reduce((current, index) => current?.children?.[index], {
    children: members,
  });

const findEmployeeById = (members, id) => {
  for (const member of members || []) {
    if (String(member._id) === String(id)) return member;
    const nested = findEmployeeById(member.children, id);
    if (nested) return nested;
  }
  return null;
};

const updateEmployeeById = (members, id, updater) =>
  (members || []).map((member) =>
    String(member._id) === String(id)
      ? updater(member)
      : {
          ...member,
          children: updateEmployeeById(member.children, id, updater),
        },
  );

function EmployeeEditor({
  employee,
  path,
  onChange,
  onAddChild,
  onRemove,
  onUpload,
  onRemoveImage,
}) {
  return (
    <article className={treeStyles.employeeNode}>
      <div className={treeStyles.employeeBar}>
        <span>LEVEL {path.length} EMPLOYEE</span>
        <div>
          <button type="button" onClick={() => onAddChild(path)}>
            <Plus size={13} /> Add report
          </button>
          <button
            className={treeStyles.removeEmployee}
            type="button"
            aria-label="Remove employee"
            onClick={() => onRemove(path)}
          >
            <Trash2 size={13} /> Remove
          </button>
        </div>
      </div>
      <div className={treeStyles.employeeBody}>
        <div className={`${styles.imageControl} ${treeStyles.compactControl}`}>
          <label className={`${styles.memberImage} ${treeStyles.compactImage}`}>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => onUpload(event.target.files?.[0], path)}
            />
            {employee.image ? (
              <img src={employee.image} alt="Employee preview" />
            ) : (
              <UserRound size={22} />
            )}
            <span>{employee.image ? "Change image" : "Add image"}</span>
          </label>
          {employee.image && (
            <button
              type="button"
              className={styles.imageRemove}
              title="Remove employee image"
              aria-label="Remove employee image"
              onClick={() => onRemoveImage(path)}
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
        <div>
          <label>
            Name
            <input
              required
              minLength="2"
              maxLength="100"
              value={employee.name}
              onChange={(event) => onChange(path, "name", event.target.value)}
            />
          </label>
          <label>
            Role
            <input
              required
              minLength="2"
              maxLength="120"
              value={employee.role}
              onChange={(event) => onChange(path, "role", event.target.value)}
            />
          </label>
          <label>
            Short description
            <textarea
              required
              maxLength="50"
              value={employee.bio || ""}
              onChange={(event) => onChange(path, "bio", event.target.value)}
            />
            <small>{(employee.bio || "").length}/50</small>
          </label>
        </div>
      </div>
      {(employee.children || []).length > 0 && (
        <div className={treeStyles.childEmployees}>
          {employee.children.map((child, index) => (
            <EmployeeEditor
              key={child._id || index}
              employee={child}
              path={[...path, index]}
              onChange={onChange}
              onAddChild={onAddChild}
              onRemove={onRemove}
              onUpload={onUpload}
              onRemoveImage={onRemoveImage}
            />
          ))}
        </div>
      )}
    </article>
  );
}

export default function AdminLeadershipManager({ confirmDelete }) {
  const [teams, setTeams] = useState([]);
  const [draft, setDraft] = useState(blankTeam());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    getAdminLeadership()
      .then((items) => {
        if (!active) return;
        setTeams(items);
        if (items.length) setDraft(items[0]);
      })
      .catch((error) => {
        if (active) setMessage(error.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const setField = (field, value) =>
    setDraft((current) => ({ ...current, [field]: value }));
  const setOwner = (field, value) =>
    setDraft((current) => ({
      ...current,
      owner: { ...current.owner, [field]: value },
    }));
  const setMember = (path, field, value) =>
    setDraft((current) => ({
      ...current,
      members: updateEmployee(current.members, path, (member) => ({
        ...member,
        [field]: value,
      })),
    }));
  const addChild = (path) =>
    setDraft((current) => ({
      ...current,
      members: updateEmployee(current.members, path, (member) => ({
        ...member,
        children: [...(member.children || []), blankEmployee()],
      })),
    }));
  const removeMember = (path) =>
    setDraft((current) => {
      const parentPath = path.slice(0, -1);
      const removeIndex = path.at(-1);
      if (!parentPath.length)
        return {
          ...current,
          members: current.members.filter((_, index) => index !== removeIndex),
        };
      return {
        ...current,
        members: updateEmployee(current.members, parentPath, (parent) => ({
          ...parent,
          children: (parent.children || []).filter(
            (_, index) => index !== removeIndex,
          ),
        })),
      };
    });
  const upload = async (file, path = [], target = "member") => {
    if (!file) return;
    setMessage("Uploading image…");
    try {
      const previousImage =
        target === "owner"
          ? draft.owner.image
          : getEmployee(draft.members, path)?.image;
      const image = await uploadTeamImage(file, previousImage);
      if (target === "owner") setOwner("image", image);
      else setMember(path, "image", image);
      setMessage("Image uploaded. Save the team to publish it.");
    } catch (error) {
      setMessage(error.message);
    }
  };
  const removeUploadedImage = async (path = [], target = "member") => {
    const employee =
      target === "owner" ? null : getEmployee(draft.members, path);
    const imageUrl = target === "owner" ? draft.owner.image : employee?.image;
    if (!imageUrl) return;

    const storedTeam = teams.find((team) => team._id === draft._id);
    const storedPerson =
      target === "owner"
        ? storedTeam?.owner
        : findEmployeeById(storedTeam?.members, employee?._id);
    setSaving(true);
    setMessage("Removing image...");
    try {
      if (draft._id && storedPerson?.image) {
        const personId = target === "owner" ? "owner" : employee._id;
        await deleteLeadershipImage(draft._id, personId);
      } else {
        await deleteUnattachedTeamImage(imageUrl);
      }

      if (target === "owner") setOwner("image", "");
      else setMember(path, "image", "");
      if (draft._id)
        setTeams((current) =>
          current.map((team) => {
            if (team._id !== draft._id) return team;
            if (target === "owner")
              return { ...team, owner: { ...team.owner, image: "" } };
            return {
              ...team,
              members: updateEmployeeById(
                team.members,
                employee._id,
                (member) => ({ ...member, image: "" }),
              ),
            };
          }),
        );
      setMessage("Profile image removed permanently.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };
  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const payload = payloadFor(draft);
      const saved = draft._id
        ? await updateLeadershipTeam(draft._id, payload)
        : await createLeadershipTeam(payload);
      setTeams((current) =>
        draft._id
          ? current.map((item) => (item._id === saved._id ? saved : item))
          : [...current, saved],
      );
      setDraft(saved);
      setMessage("Leadership team saved successfully.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };
  const remove = async () => {
    if (
      !draft._id ||
      !(await confirmDelete({
        title: "Delete this owner team?",
        message:
          "The owner, team members, and their uploaded images will be permanently removed.",
        confirmLabel: "Delete team",
      }))
    )
      return;
    try {
      await deleteLeadershipTeam(draft._id);
      const remaining = teams.filter((item) => item._id !== draft._id);
      setTeams(remaining);
      setDraft(remaining[0] || blankTeam());
      setMessage("Leadership team deleted.");
    } catch (error) {
      setMessage(error.message);
    }
  };

  if (loading)
    return (
      <section className={styles.state}>Loading people hierarchy…</section>
    );
  return (
    <section className={styles.workspace}>
      <header>
        <div>
          <h2>People hierarchy</h2>
          <p>Manage owners, departments, and reporting members.</p>
        </div>
        <button
          type="button"
          className={adminStyles.managementCreateButton}
          disabled={teams.length >= 2}
          onClick={() => setDraft(blankTeam())}
        >
          <Plus size={16} /> Add owner
        </button>
      </header>
      <div className={styles.tabs}>
        {teams.map((team) => (
          <button
            type="button"
            className={draft._id === team._id ? styles.active : ""}
            key={team._id}
            onClick={() => setDraft(team)}
          >
            {team.owner.name}
          </button>
        ))}
      </div>
      {message && <p className={styles.message}>{message}</p>}
      <form onSubmit={save}>
        <div className={styles.sectionHead}>
          <UserRound size={18} />
          <div>
            <h3>Owner and department</h3>
            <p>Only the essential information shown in the hierarchy.</p>
          </div>
        </div>
        <div className={styles.ownerProfile}>
          <div className={styles.imageControl}>
            <label className={styles.ownerImage}>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) =>
                  upload(event.target.files?.[0], [], "owner")
                }
              />
              {draft.owner.image ? (
                <img src={draft.owner.image} alt="Owner preview" />
              ) : (
                <UserRound size={28} />
              )}
              <span>
                <Camera size={13} />
                {draft.owner.image ? "Change photo" : "Add photo"}
              </span>
            </label>
            {draft.owner.image && (
              <button
                type="button"
                className={styles.imageRemove}
                title="Remove owner image"
                aria-label="Remove owner image"
                onClick={() => removeUploadedImage([], "owner")}
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
          <div className={styles.ownerFields}>
            <label>
              Owner name
              <input
                required
                minLength="2"
                maxLength="100"
                value={draft.owner.name}
                onChange={(event) => setOwner("name", event.target.value)}
              />
            </label>
            <label>
              Owner role
              <input
                required
                minLength="2"
                maxLength="120"
                value={draft.owner.role}
                onChange={(event) => setOwner("role", event.target.value)}
              />
            </label>
            <label>
              Department name
              <input
                required
                minLength="2"
                maxLength="120"
                value={draft.department}
                onChange={(event) => setField("department", event.target.value)}
              />
            </label>
            <label>
              Department summary
              <textarea
                required
                minLength="2"
                maxLength="120"
                value={draft.summary}
                onChange={(event) => setField("summary", event.target.value)}
              />
              <small>{(draft.summary || "").length}/120</small>
            </label>
          </div>
        </div>
        <div className={styles.memberHeader}>
          <div>
            <h3>Team members</h3>
            <p>Add every employee in this owner’s hierarchy.</p>
          </div>
          <button
            type="button"
            onClick={() =>
              setField("members", [...draft.members, blankEmployee()])
            }
          >
            <Plus size={15} /> Add member
          </button>
        </div>
        <div className={`${styles.members} ${treeStyles.members}`}>
          {draft.members.map((member, index) => (
            <EmployeeEditor
              key={member._id || index}
              employee={member}
              path={[index]}
              onChange={setMember}
              onAddChild={addChild}
              onRemove={removeMember}
              onUpload={upload}
              onRemoveImage={removeUploadedImage}
            />
          ))}
        </div>
        <footer>
          <button
            className={styles.delete}
            type="button"
            disabled={!draft._id}
            onClick={remove}
          >
            <Trash2 size={16} /> Delete owner
          </button>
          <button className={styles.save} disabled={saving}>
            <Save size={16} /> {saving ? "Saving…" : "Save hierarchy"}
          </button>
        </footer>
      </form>
    </section>
  );
}
