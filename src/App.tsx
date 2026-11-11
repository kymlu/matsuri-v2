import { useEffect, useState } from 'react';
import './App.css';
import HomePage, { ChoreoStatus } from './pages/HomePage';
import { NewChoreoPage } from './pages/NewChoreoPage';
import ChoreoEditPage from './pages/ChoreoEditPage';
import ChoreoViewPage from './pages/ChoreoViewPage';
import { BasicChoreoDetails, Choreo, EventDetails } from './models/choreo';
import { getUserName, setUserName } from './lib/dataAccess/LocalStorageController';
import { useNavigate, useParams } from 'react-router-dom';
import { Team } from './models/team';
import { checkLogin, verifyTeam } from './lib/helpers/apiHelper';
import AdminPage from './pages/AdminPage';
import RosterPage from './pages/RosterPage';
import { RosterKind } from './models/roster';
import { HelpProvider } from './components/help/HelpContext';
import { isNullOrUndefinedOrBlank } from './lib/helpers/globalHelper';
import { Grid } from 'react-loader-spinner';
import { colorPalette } from './lib/consts/colors';
import { useSearchParams } from 'react-router-dom';

type Mode = "home" | "form" | "edit" | "view" | "admin" | "roster";

function App() {
  const [mode, setMode] = useState<Mode>("home");
  // The 名簿 page's last tab, kept for the session.
  const [rosterTab, setRosterTab] = useState<RosterKind>("dancer");
  const [selectedEvent, setSelectedEvent] = useState<EventDetails>();
  const [eventList, setEventList] = useState<EventDetails[]>([]);
  const [serverChoreo, setServerChoreo] = useState<BasicChoreoDetails | undefined>();
  const [currentChoreo, setCurrentChoreo] = useState<Choreo | undefined>();
  const [currentChoreoStatus, setCurrentChoreoStatus] = useState<ChoreoStatus>();
  const [pastVersion, setPastVersion] = useState<number | undefined>();
  const [name, setName] = useState<string | null>(null);
  const [buildInfo, setBuildInfo] = useState<string | undefined>();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isViewer, setIsViewer] = useState<boolean>(false);
  const [currentTeamMemberId, setCurrentTeamMemberId] = useState<string | undefined>();
  const [isProcessing, setIsProcessing] = useState<boolean>(true);
  const [showNoTeamDialog, setShowNoTeamDialog] = useState<boolean>(false);

  const { teamSlug } = useParams();

  const [searchParams] = useSearchParams();
  const setupToken = searchParams.get('setup');

  useEffect(() => {
    const href = teamSlug ? `/api/manifest/${teamSlug}` : "/manifest.json";

    let link = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "manifest";
      document.head.appendChild(link);
    }
    link.href = href;
  }, [teamSlug]);

  const [team, setTeam] = useState<Team | undefined>(undefined);
  const navigate = useNavigate();

  useEffect(() => {
    if (isNullOrUndefinedOrBlank(teamSlug)) {
      setShowNoTeamDialog(true);
      setIsProcessing(false);
    } else {
      verifyTeam(teamSlug!!, (t) => {
        setTeam(t);
        checkLogin(t?.id!,
        (name, role, teamMemberId) => {
          setNewName(name);
          setIsAdmin(role === "admin");
          setIsViewer(role === "viewer");
          setIsLoggedIn(true);
          setCurrentTeamMemberId(teamMemberId);
        }, () => {
          setIsLoggedIn(false);
        });
        setIsProcessing(false);
      }, () => {
        navigate('/');
        setIsProcessing(false);
      });
    }
  }, []);

  useEffect(() => {
    setName(getUserName());
    console.log("getting build info");
    fetch(`${process.env.PUBLIC_URL}/build-info.json`)
      .then(r => r.json())
      .then(info => {
        const buildDate = info.buildDate;
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
    <HelpProvider reader={{ hasTeam: !!team, isLoggedIn, isViewer, isAdmin }}>
    <div>
      {
        currentTeamMemberId && team && mode === "admin" && (
          <AdminPage
            goToHomePage={() => setMode("home")}
            team={team}
            currentUserId={currentTeamMemberId}
          />
        )
      }
      {
        team && isLoggedIn && !isViewer && mode === "roster" && (
          <RosterPage
            goToHomePage={() => setMode("home")}
            team={team}
            tab={rosterTab}
            onTabChange={setRosterTab}
          />
        )
      }
      {
        isProcessing &&
        <div className='w-full h-svh'>
          <Grid
              height={44}
              width={44}
              wrapperClass="mt-4 justify-self-center"
              color={colorPalette.primary}
              ariaLabel="読み込み中"/>
        </div>
      }
      {!isProcessing && mode === "home" && (
        <HomePage
          buildInfo={buildInfo}
          eventList={eventList}
          setEventList={(eventList) => {
            setEventList(eventList);
          }}
          goToAdminPage={() => {
            setMode("admin");
          }}
          goToRosterPage={() => {
            setMode("roster");
          }}
          goToNewChoreoPage={(event) => {
            setSelectedEvent(event);
            setMode("form");
          }}
          goToViewPage={(choreo: Choreo, status: ChoreoStatus, serverChoreo?: BasicChoreoDetails, pastVersion?: number) => {
            setServerChoreo(serverChoreo);
            setCurrentChoreo(choreo);
            setCurrentChoreoStatus(status);
            setPastVersion(pastVersion);
            setMode("view");
          }}
          savedDancerName={name}
          setSavedDancerName={(newName) => setNewName(newName)}
          isAdmin={isAdmin}
          setIsAdmin={setIsAdmin}
          isViewer={isViewer}
          setIsViewer={setIsViewer}
          isLoggedIn={isLoggedIn}
          setIsLoggedIn={setIsLoggedIn}
          team={team}
          setCurrentTeamMemberId={(id) => setCurrentTeamMemberId(id)}
          showNoTeamDialog={showNoTeamDialog}
          setShowNoTeamDialog={setShowNoTeamDialog}
          setupToken={setupToken}
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
          teamId={team?.id}
          canUseRoster={!!team && isLoggedIn && !isViewer}
        />
      )}
      {mode === "edit" && (
        <ChoreoEditPage
          currentChoreo={currentChoreo!!}
          currentChoreoStatus={currentChoreoStatus!!}
          goToHomePage={() => setMode("home")}
          goToViewPage={(choreo) => {
            setCurrentChoreo(choreo);
            setPastVersion(undefined);
            setMode("view");
          }}
          eventList={eventList}
          onChoreoEdited={() => {
            if (currentChoreoStatus === "upToDate") {
              setCurrentChoreoStatus("edited");
            }
          }}
          serverChoreo={serverChoreo}
          isLoggedIn={isLoggedIn}
          isViewer={isViewer}
          teamId={team?.id}
        />
      )}
      {mode === "view" && (
        <ChoreoViewPage
          currentChoreo={currentChoreo!!}
          currentChoreoStatus={currentChoreoStatus!!}
          goToHomePage={() => setMode("home")}
          goToEditPage={() => setMode("edit")}
          pastVersion={pastVersion}
          savedDancerName={name}
          teamId={team?.id}
          serverChoreo={serverChoreo}
        />
      )}
    </div>
    </HelpProvider>
  );
}

export default App;
