import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EventFormDialog } from './event-form-dialog';
import { api } from '@/trpc/react';

// Mock the TRPC API
jest.mock('@/trpc/react', () => ({
  api: {
    useUtils: jest.fn().mockReturnValue({
      event: {
        getAll: {
          invalidate: jest.fn(),
        },
      },
    }),
    event: {
      create: {
        useMutation: jest.fn().mockReturnValue({
          mutateAsync: jest.fn().mockResolvedValue({ id: 'new-event-id' }),
          isPending: false,
        }),
      },
      update: {
        useMutation: jest.fn().mockReturnValue({
          mutateAsync: jest.fn().mockResolvedValue({ id: 'updated-event-id' }),
          isPending: false,
        }),
      },
    },
  },
}));

describe('EventFormDialog', () => {
  const mockOnOpenChange = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders the create event form when no event is provided', () => {
    render(
      <EventFormDialog 
        open={true} 
        onOpenChange={mockOnOpenChange} 
      />
    );
    
    expect(screen.getByText('Create Event')).toBeInTheDocument();
    expect(screen.getByLabelText('Event Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
    expect(screen.getByLabelText('End Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Location')).toBeInTheDocument();
    expect(screen.getByLabelText('Category')).toBeInTheDocument();
    expect(screen.getByLabelText('Max Attendees')).toBeInTheDocument();
    expect(screen.getByLabelText('Event Image')).toBeInTheDocument();
  });
  
  it('renders the edit event form when an event is provided', () => {
    const mockEvent = {
      id: 'test-event-id',
      name: 'Test Event',
      description: 'Test Description',
      location: 'Test Location',
      startDate: new Date(),
      endDate: new Date(),
      maxAttendees: 100,
      category: 'Test Category',
      featured: false,
      image: '',
    };
    
    render(
      <EventFormDialog 
        open={true} 
        onOpenChange={mockOnOpenChange} 
        event={mockEvent}
      />
    );
    
    expect(screen.getByText('Edit Event')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Event')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Location')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Category')).toBeInTheDocument();
    expect(screen.getByDisplayValue('100')).toBeInTheDocument();
  });
  
  it('calls onOpenChange when cancel button is clicked', () => {
    render(
      <EventFormDialog 
        open={true} 
        onOpenChange={mockOnOpenChange} 
      />
    );
    
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });
  
  it('submits the form with correct data for create event', async () => {
    const createMutateAsync = jest.fn().mockResolvedValue({ id: 'new-event-id' });
    (api.event.create.useMutation as jest.Mock).mockReturnValue({
      mutateAsync: createMutateAsync,
      isPending: false,
    });
    
    render(
      <EventFormDialog 
        open={true} 
        onOpenChange={mockOnOpenChange} 
      />
    );
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText('Event Name'), { target: { value: 'New Test Event' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'New Test Description' } });
    fireEvent.change(screen.getByLabelText('Location'), { target: { value: 'New Test Location' } });
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'New Test Category' } });
    fireEvent.change(screen.getByLabelText('Max Attendees'), { target: { value: '200' } });
    
    // Submit the form
    fireEvent.click(screen.getByText('Create Event'));
    
    await waitFor(() => {
      expect(createMutateAsync).toHaveBeenCalledWith(expect.objectContaining({
        name: 'New Test Event',
        description: 'New Test Description',
        location: 'New Test Location',
        category: 'New Test Category',
        maxAttendees: 200,
      }));
    });
  });
});
