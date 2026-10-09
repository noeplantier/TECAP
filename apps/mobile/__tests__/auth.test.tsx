import { Alert } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { AuthScreen } from '../src/screens/AuthScreen';

describe('AuthScreen', () => {
  it('requires 18+ consent before continuing', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const { getByText, getByPlaceholderText } = render(<AuthScreen />);
    fireEvent.changeText(getByPlaceholderText('ton@email.com'), 'test@example.com');
    fireEvent.press(getByText('Commencer'));
    expect(alertSpy).toHaveBeenCalledWith(
      'Encore une étape',
      'Entre un email valide et confirme que tu as 18 ans ou plus.',
    );
    alertSpy.mockRestore();
  });
});
