import { fireEvent, render } from '@testing-library/react-native';
import { FriendsScreen, CrewScreen, VenueDetailScreen } from '../src/screens/CommunityScreens';

const navigation = { navigate: jest.fn(), goBack: jest.fn() };

describe('TÉCAP community flows', () => {
  beforeEach(() => jest.clearAllMocks());

  it('accepts a friend request without exposing precise location', () => {
    const screen = render(<FriendsScreen navigation={navigation} />);
    fireEvent.press(screen.getByText('Demandes  2'));
    expect(screen.getByText('Camille, 23')).toBeTruthy();
    fireEvent.press(screen.getAllByText('Accepter')[0]!);
    expect(screen.getByText('Ajouté ✓')).toBeTruthy();
  });

  it('creates a crew outing from a short title', () => {
    const screen = render(<CrewScreen navigation={navigation} />);
    fireEvent.press(screen.getByText('＋'));
    fireEvent.changeText(screen.getByPlaceholderText('Ex. Apéro entre Rennais·es'), 'Apéro Rennes');
    fireEvent.press(screen.getByText('Créer'));
    expect(screen.getByText('Apéro Rennes')).toBeTruthy();
  });

  it('opens the status composer with the venue prefilled from the place card', () => {
    const screen = render(
      <VenueDetailScreen
        navigation={navigation}
        route={{ params: { venue: 'L’Apsara', count: 124 } }}
      />,
    );
    expect(screen.getByText('124')).toBeTruthy();
    fireEvent.press(screen.getByText('J’y vais · publier mon statut'));
    expect(navigation.navigate).toHaveBeenCalledWith('EveningStatus', { venue: 'L’Apsara' });
  });
});
