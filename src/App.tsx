import { useEffect, useState } from 'react';
import './App.css';
import HomePage, { ChoreoStatus } from './pages/HomePage';
import { NewChoreoPage } from './pages/NewChoreoPage';
import ChoreoEditPage from './pages/ChoreoEditPage';
import ChoreoViewPage from './pages/ChoreoViewPage';
import { BasicChoreoDetails, Choreo, EventDetails } from './models/choreo';
import { getUserName, setUserName } from './lib/dataAccess/LocalStorageController';

type Mode = "home" | "form" | "edit" | "view";

function App() {
  const [mode, setMode] = useState<Mode>("home");
  const [selectedEvent, setSelectedEvent] = useState<EventDetails>();
  const [eventList, setEventList] = useState<EventDetails[]>([]);
  const [dancerNamesByEvent, setDancerNamesByEvent] = useState<Record<string, Record<string, string[]>>>({});
  const [serverChoreo, setServerChoreo] = useState<BasicChoreoDetails | undefined>();
  const [currentChoreo, setCurrentChoreo] = useState<Choreo | undefined>();
  const [currentChoreoStatus, setCurrentChoreoStatus] = useState<ChoreoStatus>();
  const [name, setName] = useState<string | null>(null);
  const [buildInfo, setBuildInfo] = useState<string | undefined>();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("loggedIn") === "true") {
      console.log("Logged in!")
      window.history.replaceState({}, "", "/");
    }
  }, []);

  useEffect(() => {
    setName(getUserName());
    console.log("getting build info");
    fetch(`${process.env.PUBLIC_URL}/build-info.json`)
      .then(r => r.json())
      .then(info => {
        var buildDate = info.buildDate;
        console.log(`Build: ${buildDate}`);
        setBuildInfo(`更新 ${buildDate}`);
      });
  }, []);

  const setNewName = (newName: string) => {
    setUserName(newName);
    setName(newName);
  }

  useEffect(() => {
    console.log("Changing mode:", mode);
  }, [mode]);

  return (
    <div>
      {mode === "home" && (
        <HomePage
          buildInfo={buildInfo}
          eventList={eventList}
          setEventList={(eventList) => {
            setEventList(eventList);
          }}
          goToNewChoreoPage={(event) => {
            setSelectedEvent(event);
            setMode("form");
          }}
          goToViewPage={(choreo: Choreo, status: ChoreoStatus, serverChoreo?: BasicChoreoDetails) => {
            setServerChoreo(serverChoreo);
            setCurrentChoreo(choreo);
            setCurrentChoreoStatus(status);
            setMode("view");
          }}
          userName={name}
          setUserName={(newName) => setNewName(newName)}
          dancerNamesByEvent={dancerNamesByEvent}
          setDancerNamesByEvent={(groupedNames) => setDancerNamesByEvent(groupedNames)}
          isLoggedIn={isLoggedIn}
          setIsLoggedIn={setIsLoggedIn}
        />
      )}
      {mode === "form" && (
        <NewChoreoPage
          goToHomePage={() => setMode("home")}
          goToEditPage={(choreo: Choreo) => {
            setCurrentChoreo(choreo);
            setCurrentChoreoStatus("localOnly")
            setMode("edit");
          }}
          eventList={eventList}
          selectedEvent={selectedEvent}
        />
      )}
      {mode === "edit" && (
        <ChoreoEditPage
          currentChoreo={currentChoreo!!}
          currentChoreoStatus={currentChoreoStatus!!}
          goToHomePage={() => setMode("home")}
          goToViewPage={(choreo) => {
            setCurrentChoreo(choreo);
            setMode("view");
          }}
          eventList={eventList}
          dancerNamesByEvent={dancerNamesByEvent}
          onChoreoEdited={() => {
            if(currentChoreoStatus === "upToDate") {
              setCurrentChoreoStatus("edited");
            }
          }}
          serverChoreo={serverChoreo}
          isLoggedIn={isLoggedIn}
        />
      )}
      {mode === "view" && (
        <ChoreoViewPage
          currentChoreo={currentChoreo!!}
          currentChoreoStatus={currentChoreoStatus!!}
          goToHomePage={() => setMode("home")}
          goToEditPage={() => setMode("edit")}
          userName={name}
        />
      )}
    </div>
  );
}

export default App;
