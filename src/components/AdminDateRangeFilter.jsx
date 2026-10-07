import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import styles from "./AdminDateRangeFilter.module.css";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const dateValue = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const parseDate = (value) => value ? new Date(`${value}T00:00:00`) : new Date();
const displayDate = (value) => value ? parseDate(value).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }) : "";

export default function AdminDateRangeFilter({ fromDate, toDate, onApply }) {
  const root = useRef(null);
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(fromDate);
  const [to, setTo] = useState(toDate);
  const [selectingEnd, setSelectingEnd] = useState(false);
  const [month, setMonth] = useState(() => {
    const initial = parseDate(fromDate);
    return new Date(initial.getFullYear(), initial.getMonth(), 1);
  });
  const today = dateValue(new Date());
  const now = new Date();
  const isCurrentMonth = month.getFullYear() === now.getFullYear() && month.getMonth() === now.getMonth();

  useEffect(() => {
    const close = (event) => !root.current?.contains(event.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  useEffect(() => {
    setFrom(fromDate);
    setTo(toDate);
  }, [fromDate, toDate]);

  const days = useMemo(() => {
    const start = new Date(month.getFullYear(), month.getMonth(), 1 - new Date(month.getFullYear(), month.getMonth(), 1).getDay());
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return { date, value: dateValue(date), current: date.getMonth() === month.getMonth() };
    });
  }, [month]);

  const select = (value) => {
    if (!selectingEnd || !from) {
      setFrom(value);
      setTo(value);
      setSelectingEnd(true);
    } else {
      if (value < from) {
        setTo(from);
        setFrom(value);
      } else setTo(value);
      setSelectingEnd(false);
    }
  };
  const clear = () => {
    setFrom("");
    setTo("");
    setSelectingEnd(false);
    onApply("", "");
    setOpen(false);
  };
  const label = fromDate ? (toDate && toDate !== fromDate ? `${displayDate(fromDate)} – ${displayDate(toDate)}` : displayDate(fromDate)) : "Select date";

  return <div className={styles.root} ref={root}>
    <button type="button" className={`${styles.trigger} ${fromDate ? styles.active : ""}`} aria-expanded={open} onClick={() => { setOpen((value) => !value); setSelectingEnd(false); }}>
      <CalendarDays size={14}/><span>{label}</span>
      {fromDate && <i onClick={(event) => { event.stopPropagation(); clear(); }}><X size={12}/></i>}
      <ChevronDown size={13}/>
    </button>
    {open && <div className={styles.popover}>
      <header><div><strong>Select date or range</strong><small>{selectingEnd ? "Choose an end date, or apply for one day" : "Choose the first date"}</small></div><button type="button" aria-label="Close calendar" onClick={() => setOpen(false)}><X size={14}/></button></header>
      <div className={styles.monthNav}>
        <button type="button" aria-label="Previous month" onClick={() => setMonth((date) => new Date(date.getFullYear(), date.getMonth() - 1, 1))}><ChevronLeft size={16}/></button>
        <strong>{month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</strong>
        <button type="button" aria-label="Next month" disabled={isCurrentMonth} onClick={() => setMonth((date) => new Date(date.getFullYear(), date.getMonth() + 1, 1))}><ChevronRight size={16}/></button>
      </div>
      <div className={styles.calendar}>
        {WEEKDAYS.map((day) => <span className={styles.weekday} key={day}>{day}</span>)}
        {days.map(({ date, value, current }) => {
          const inRange = from && to && value >= from && value <= to;
          const edge = value === from || value === to;
          const future = value > today;
          return <button type="button" key={value} disabled={future} className={`${!current ? styles.outside : ""} ${inRange ? styles.inRange : ""} ${edge ? styles.edge : ""} ${future ? styles.future : ""}`} aria-label={`${date.toLocaleDateString()}${future ? " unavailable" : ""}`} onClick={() => select(value)}>{date.getDate()}</button>;
        })}
      </div>
      <div className={styles.selection}><span><small>From</small>{from ? displayDate(from) : "Select date"}</span><i>→</i><span><small>To</small>{to ? displayDate(to) : "Select date"}</span></div>
      <footer><button type="button" onClick={clear}>Clear</button><button type="button" disabled={!from} onClick={() => { onApply(from, to || from); setOpen(false); }}>Apply filter</button></footer>
    </div>}
  </div>;
}
