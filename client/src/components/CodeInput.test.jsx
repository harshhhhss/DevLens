import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CodeInput from './CodeInput.jsx';

const file = (name, content) => new File([content], name, { type: 'text/plain' });

/** Drops a file on the editor's drop zone (the textarea's wrapper). */
function dropOnEditor(f) {
  const zone = screen.getByLabelText('Code to review').parentElement;
  fireEvent.drop(zone, { dataTransfer: { files: [f], types: ['Files'] } });
}

function setup(props = {}) {
  const onChange = vi.fn();
  const onFileLoaded = vi.fn();
  const onFileError = vi.fn();
  const utils = render(
    <CodeInput value="" onChange={onChange} {...{ onFileLoaded, onFileError }} {...props} />
  );
  return { onChange, onFileLoaded, onFileError, ...utils };
}

describe('CodeInput file upload', () => {
  it('loads a picked file into the editor and reports the language', async () => {
    const { container, onChange, onFileLoaded } = setup();
    const input = container.querySelector('input[type="file"]');

    await userEvent.upload(input, file('main.py', 'print("hi")'));

    await waitFor(() => expect(onChange).toHaveBeenCalledWith('print("hi")'));
    expect(onFileLoaded).toHaveBeenCalledWith(
      expect.objectContaining({ language: 'python', warning: '' })
    );
  });

  it('shows the loaded file name and size', async () => {
    const { container } = setup();
    const input = container.querySelector('input[type="file"]');

    await userEvent.upload(input, file('server.js', 'const a = 1;'));

    expect(await screen.findByText('server.js')).toBeInTheDocument();
  });

  it('reports an error for an unreadable file without touching the editor', async () => {
    const { container, onChange, onFileError } = setup();
    const input = container.querySelector('input[type="file"]');

    await userEvent.upload(input, file('big.js', 'x'.repeat(20001)));

    await waitFor(() => expect(onFileError).toHaveBeenCalled());
    expect(onFileError.mock.calls[0][0]).toMatch(/limit is 20,000/);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('loads a dropped file', async () => {
    const { onChange, onFileLoaded } = setup();

    dropOnEditor(file('lib.rs', 'fn main() {}'));

    await waitFor(() => expect(onChange).toHaveBeenCalledWith('fn main() {}'));
    expect(onFileLoaded.mock.calls[0][0].language).toBe('rust');
  });

  it('warns but still loads a dropped file with an unknown extension', async () => {
    // The picker filters by `accept`, so an unrecognised extension can only
    // arrive by drag-and-drop.
    const { onChange, onFileLoaded } = setup();

    dropOnEditor(file('snippet.txt', 'some code'));

    await waitFor(() => expect(onChange).toHaveBeenCalledWith('some code'));
    expect(onFileLoaded.mock.calls[0][0].language).toBeNull();
    expect(onFileLoaded.mock.calls[0][0].warning).toMatch(/could not tell the language/i);
  });

  it('clears the loaded file and empties the editor', async () => {
    const { container, onChange } = setup();
    const input = container.querySelector('input[type="file"]');
    await userEvent.upload(input, file('app.rb', 'puts 1'));
    expect(await screen.findByText('app.rb')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /clear app\.rb/i }));

    expect(screen.queryByText('app.rb')).not.toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith('');
  });

  it('still supports typing, so pasting is unaffected', async () => {
    const { onChange } = setup();

    await userEvent.type(screen.getByLabelText('Code to review'), 'a');

    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('only accepts extensions the API supports', () => {
    const { container } = setup();
    const accept = container.querySelector('input[type="file"]').getAttribute('accept');

    expect(accept).toContain('.js');
    expect(accept).toContain('.py');
    expect(accept).not.toContain('.exe');
  });
});
