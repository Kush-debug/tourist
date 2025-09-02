import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SafetyScore } from '@/components/SafetyScore';
import { dataService } from '@/services/DataService';

// Mock the DataService
jest.mock('@/services/DataService', () => ({
  dataService: {
    saveSafetyData: jest.fn().mockResolvedValue({ success: true })
  }
}));

describe('SafetyScore Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders safety score with default values', () => {
    render(<SafetyScore />);
    
    expect(screen.getByText('Tourist Safety Score')).toBeInTheDocument();
    expect(screen.getByText('LIVE')).toBeInTheDocument();
    expect(screen.getByText('Refresh')).toBeInTheDocument();
  });

  test('displays correct safety status based on score', () => {
    render(<SafetyScore score={85} />);
    expect(screen.getByText('Safe')).toBeInTheDocument();
    
    render(<SafetyScore score={65} />);
    expect(screen.getByText('Caution')).toBeInTheDocument();
    
    render(<SafetyScore score={45} />);
    expect(screen.getByText('High Risk')).toBeInTheDocument();
  });

  test('recalculates score when refresh button is clicked', async () => {
    render(<SafetyScore userId="test-user" />);
    
    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);
    
    expect(screen.getByText('Calculating...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('saves data to DataService when score is recalculated', async () => {
    render(<SafetyScore userId="test-user" />);
    
    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);
    
    await waitFor(() => {
      expect(dataService.saveSafetyData).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  test('displays night mode indicator during night hours', () => {
    // Mock current time to be night (2 AM)
    jest.spyOn(Date.prototype, 'getHours').mockReturnValue(2);
    
    render(<SafetyScore />);
    expect(screen.getByText('Night Mode')).toBeInTheDocument();
    
    jest.restoreAllMocks();
  });

  test('displays day mode indicator during day hours', () => {
    // Mock current time to be day (2 PM)
    jest.spyOn(Date.prototype, 'getHours').mockReturnValue(14);
    
    render(<SafetyScore />);
    expect(screen.getByText('Day Mode')).toBeInTheDocument();
    
    jest.restoreAllMocks();
  });

  test('shows risk factors when provided', () => {
    const riskFactors = ['High crime area', 'Poor lighting'];
    render(<SafetyScore riskFactors={riskFactors} />);
    
    expect(screen.getByText('Current Risk Factors')).toBeInTheDocument();
    expect(screen.getByText('High crime area')).toBeInTheDocument();
    expect(screen.getByText('Poor lighting')).toBeInTheDocument();
  });
});
