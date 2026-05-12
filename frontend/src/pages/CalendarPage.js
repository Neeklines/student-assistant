import { useEffect, useState } from "react";

import CalendarSidebar from "../components/calendar/CalendarSidebar";
import CalendarHeader from "../components/calendar/CalendarHeader";
import DayView from "../components/calendar/DayView";
import MonthView from "../components/calendar/MonthView";
import TaskDrawer from "../components/calendar/TaskDrawer";
import EventModal from "../components/calendar/EventModal";
import WeekView from "../components/calendar/WeekView";

const DAY_START_HOUR = 6;
const DAY_END_HOUR = 23;
const HOUR_HEIGHT = 60;

function CalendarPage() {
  function getDateString(value) {
    const d = value instanceof Date ? value : new Date(value);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  const today = getDateString(new Date());

  const [events, setEvents] = useState([]);
  const [editingEventId, setEditingEventId] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(today);
  const [viewMode, setViewMode] = useState("month");

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTaskPanelOpen, setIsTaskPanelOpen] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    date: today,
    start: "09:00",
    end: "10:00",
    event_type: "study",
    priority: "medium"
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (!editingEventId) {
      setForm((prev) => ({
        ...prev,
        date: selectedDate
      }));
    }
  }, [selectedDate, editingEventId]);

  async function fetchEvents() {
    const response = await fetch("/api/calendar/events");
    const data = await response.json();

    setEvents(data);
  }

  function resetForm() {
    setForm({
      title: "",
      description: "",
      date: selectedDate,
      start: "09:00",
      end: "10:00",
      event_type: "study",
      priority: "medium"
    });

    setEditingEventId(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const payload = {
      title: form.title,
      description: form.description,
      start_time: `${form.date}T${form.start}:00`,
      end_time: `${form.date}T${form.end}:00`,
      event_type: form.event_type,
      priority: form.priority,
      status: "planned",
      created_by: "manual"
    };

    if (editingEventId) {
      await fetch(`/api/calendar/events/${editingEventId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
    } else {
      await fetch("/api/calendar/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
    }

    resetForm();
    setIsTaskPanelOpen(false);
    fetchEvents();
  }

  async function deleteEvent(id) {
    await fetch(`/api/calendar/events/${id}`, {
      method: "DELETE"
    });

    if (editingEventId === id) resetForm();
    if (selectedEvent?.id === id) setSelectedEvent(null);

    fetchEvents();
  }

  function editEvent(event) {
    const startDate = new Date(event.start_time);
    const endDate = new Date(event.end_time);

    setEditingEventId(event.id);
    setSelectedEvent(null);
    setIsTaskPanelOpen(true);
    setSelectedDate(getDateString(startDate));
    setViewMode("day");

    setForm({
      title: event.title,
      description: event.description || "",
      date: getDateString(startDate),
      start: startDate.toTimeString().slice(0, 5),
      end: endDate.toTimeString().slice(0, 5),
      event_type: event.event_type,
      priority: event.priority
    });
  }

  function changeDay(offset) {
    const date = new Date(selectedDate);

    date.setDate(date.getDate() + offset);
    setSelectedDate(getDateString(date));
  }

  function goToToday() {
    setSelectedDate(getDateString(new Date()));
  }

  function formatTime(dateValue) {
    return new Date(dateValue).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function formatDate(dateValue) {
    return new Date(dateValue).toLocaleDateString([], {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }

  function minutesFromDayStart(dateValue) {
    const date = new Date(dateValue);

    return (date.getHours() - DAY_START_HOUR) * 60 + date.getMinutes();
  }

  const visibleEvents = events.filter((event) => {
    return getDateString(event.start_time) === selectedDate;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200">
      <CalendarSidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <main className="mx-auto w-[min(1180px,calc(100vw-96px))] py-12 max-md:w-[calc(100vw-32px)] max-md:py-24">
        <CalendarHeader
          viewMode={viewMode}
          setViewMode={setViewMode}
          onOpenTaskPanel={() => setIsTaskPanelOpen(true)}
        />

        {viewMode === "month" && (
          <MonthView
            selectedDate={selectedDate}
            events={events}
            setSelectedDate={setSelectedDate}
            setViewMode={setViewMode}
            formatTime={formatTime}
          />
        )}

        {viewMode === "week" && (
          <WeekView
            selectedDate={selectedDate}
            events={events}
            setSelectedDate={setSelectedDate}
            formatDate={formatDate}
            formatTime={formatTime}
            setSelectedEvent={setSelectedEvent}
            editEvent={editEvent}
            deleteEvent={deleteEvent}
          />
        )}

        {viewMode === "day" && (
          <DayView
            selectedDate={selectedDate}
            visibleEvents={visibleEvents}
            formatDate={formatDate}
            formatTime={formatTime}
            minutesFromDayStart={minutesFromDayStart}
            changeDay={changeDay}
            goToToday={goToToday}
            setSelectedEvent={setSelectedEvent}
            editEvent={editEvent}
            deleteEvent={deleteEvent}
            dayStartHour={DAY_START_HOUR}
            dayEndHour={DAY_END_HOUR}
            hourHeight={HOUR_HEIGHT}
          />
        )}
      </main>

      <TaskDrawer
        isOpen={isTaskPanelOpen}
        onClose={() => setIsTaskPanelOpen(false)}
        editingEventId={editingEventId}
        form={form}
        setForm={setForm}
        handleSubmit={handleSubmit}
        resetForm={resetForm}
      />

      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          formatDate={formatDate}
          formatTime={formatTime}
          editEvent={editEvent}
          deleteEvent={deleteEvent}
        />
      )}
    </div>
  );
}

export default CalendarPage;