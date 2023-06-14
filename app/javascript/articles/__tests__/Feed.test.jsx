/* eslint-disable no-irregular-whitespace */
import { h } from 'preact';
import { render, waitFor } from '@testing-library/preact';
import fetch from 'jest-fetch-mock';
import '@testing-library/jest-dom';
import { Feed } from '../Feed';
import {
  feedPosts,
  feedPostsWherePinnedAndImagePostsSame,
  firstBillboard,
  secondBillboard,
  thirdBillboard,
  podcastEpisodes,
} from './utilities/feedUtilities';
import '../../../assets/javascripts/lib/xss';
import '../../../assets/javascripts/utilities/timeAgo';

global.fetch = fetch;

describe('<Feed /> component', () => {
  const getUserData = () => {
    return {
      followed_tag_names: ['javascript'],
      followed_podcast_ids: [1], //should we make this dynamic
      profile_image_90: 'mock_url_link',
      name: 'firstname lastname',
      username: 'username',
      reading_list_ids: [],
    };
  };

  beforeAll(() => {
    global.userData = jest.fn(() => getUserData());
    document.body.setAttribute('data-user', JSON.stringify(getUserData()));

    const node = document.createElement('div');
    node.setAttribute('id', 'followed-podcasts');
    node.setAttribute('data-episodes', JSON.stringify(podcastEpisodes));
    document.body.appendChild(node);
  });

  describe('feedItem organization', () => {
    let callback;
    beforeAll(() => {
      fetch.mockResponseOnce(JSON.stringify(feedPosts));
      fetch.mockResponseOnce(firstBillboard);
      fetch.mockResponseOnce(secondBillboard);
      fetch.mockResponseOnce(thirdBillboard);

      callback = jest.fn();
      render(<Feed timeFrame="" renderFeed={callback} />);
    });

    it('should return the correct length of feedItems', async () => {
      await waitFor(() => {
        const lastCallbackResult =
          callback.mock.calls[callback.mock.calls.length - 1][0];
        expect(lastCallbackResult.feedItems.length).toEqual(14);
      });
    });

    it('should set the pinnedItem and place it correctly in the feed', async () => {
      await waitFor(() => {
        const lastCallbackResult =
          callback.mock.calls[callback.mock.calls.length - 1][0];
        const firstPinnedItem = feedPosts.find((o) => o.pinned === true);
        expect(lastCallbackResult.pinnedItem).toEqual(firstPinnedItem);
        expect(lastCallbackResult.feedItems[1]).toEqual(firstPinnedItem);
      });
    });

    it('should set the imageItem and place it correctly in the feed', async () => {
      await waitFor(() => {
        const lastCallbackResult =
          callback.mock.calls[callback.mock.calls.length - 1][0];
        const firstImageItem = feedPosts.find(
          (post) => post.main_image !== null,
        );
        expect(lastCallbackResult.imageItem).toEqual(firstImageItem);
        expect(lastCallbackResult.feedItems[2]).toEqual(firstImageItem);
      });
    });

    it('should place the billboards correctly within the feedItems', async () => {
      await waitFor(() => {
        const lastCallbackResult =
          callback.mock.calls[callback.mock.calls.length - 1][0];
        expect(lastCallbackResult.feedItems[0]).toEqual(firstBillboard);
        expect(lastCallbackResult.feedItems[3]).toEqual(secondBillboard);
        expect(lastCallbackResult.feedItems[9]).toEqual(thirdBillboard);
      });
    });

    it('should place the podcasts correctly within feedItems', async () => {
      await waitFor(() => {
        const lastCallbackResult =
          callback.mock.calls[callback.mock.calls.length - 1][0];
        expect(lastCallbackResult.feedItems[4]).toEqual(podcastEpisodes);
      });
    });
  });

  describe('when pinned and image posts are the same', () => {
    let callback;
    beforeAll(() => {
      fetch.mockResponseOnce(
        JSON.stringify(feedPostsWherePinnedAndImagePostsSame),
      );
      fetch.mockResponseOnce(firstBillboard);
      fetch.mockResponseOnce(secondBillboard);
      fetch.mockResponseOnce(thirdBillboard);

      callback = jest.fn();
      render(<Feed timeFrame="" renderFeed={callback} />);
    });

    it('should not set a pinned item', async () => {
      const lastCallbackResult =
        callback.mock.calls[callback.mock.calls.length - 1][0];
      const postAndImageItem = feedPostsWherePinnedAndImagePostsSame.find(
        (post) => post.main_image !== null && post.pinned === true,
      );

      expect(lastCallbackResult.pinnedItem).toEqual(null);
      expect(lastCallbackResult.imageItem).toEqual(postAndImageItem);
      expect(lastCallbackResult.feedItems[1]).toEqual(postAndImageItem);
      expect(lastCallbackResult.feedItems[2]).not.toEqual(postAndImageItem);
    });
  });

  describe("when the timeframe prop is 'latest'", () => {
    let callback;
    beforeAll(() => {
      fetch.mockResponseOnce(JSON.stringify(feedPosts));
      fetch.mockResponseOnce(firstBillboard);
      fetch.mockResponseOnce(secondBillboard);
      fetch.mockResponseOnce(thirdBillboard);

      callback = jest.fn();
      render(<Feed timeFrame="latest" renderFeed={callback} />);
    });

    it('should not set the pinned items', async () => {
      const lastCallbackResult =
        callback.mock.calls[callback.mock.calls.length - 1][0];
      expect(lastCallbackResult.pinnedItem).toEqual(null);
    });

    it('should return the correct length of feedItems (by excluding pinned item)', async () => {
      await waitFor(() => {
        const lastCallbackResult =
          callback.mock.calls[callback.mock.calls.length - 1][0];
        expect(lastCallbackResult.feedItems.length).toEqual(13);
      });
    });
  });

  describe("when we there isn't all three billboards on the home feed", () => {
    describe("when there isn't a feed_second billboard", () => {
      let callback;
      beforeAll(() => {
        fetch.mockResponseOnce(JSON.stringify(feedPosts));
        fetch.mockResponseOnce(firstBillboard);
        fetch.mockResponseOnce(undefined);
        fetch.mockResponseOnce(thirdBillboard);

        callback = jest.fn();
        render(<Feed timeFrame="" renderFeed={callback} />);
      });

      it('should return the correct length of feedItems', async () => {
        await waitFor(() => {
          const lastCallbackResult =
            callback.mock.calls[callback.mock.calls.length - 1][0];
          expect(lastCallbackResult.feedItems.length).toEqual(13);
        });
      });

      it('should still amend the organization of the feedItems correctly', async () => {
        await waitFor(() => {
          const lastCallbackResult =
            callback.mock.calls[callback.mock.calls.length - 1][0];
          expect(lastCallbackResult.feedItems[0]).toEqual(firstBillboard);
          // there is no second bilboard so podcasts get rendered in 4th place
          expect(lastCallbackResult.feedItems[3]).toEqual(podcastEpisodes);
          expect(lastCallbackResult.feedItems[8]).toEqual(thirdBillboard);
        });
      });
    });

    describe("when there isn't a feed_first or feed_second billboard", () => {
      let callback;
      beforeAll(() => {
        fetch.mockResponseOnce(JSON.stringify(feedPosts));
        fetch.mockResponseOnce(undefined);
        fetch.mockResponseOnce(undefined);
        fetch.mockResponseOnce(thirdBillboard);

        callback = jest.fn();
        render(<Feed timeFrame="" renderFeed={callback} />);
      });

      it('should return the correct length of feedItems', async () => {
        await waitFor(() => {
          const lastCallbackResult =
            callback.mock.calls[callback.mock.calls.length - 1][0];
          expect(lastCallbackResult.feedItems.length).toEqual(12);
        });
      });

      it('should still amend the organization of the feedItems correctly', async () => {
        await waitFor(() => {
          const lastCallbackResult =
            callback.mock.calls[callback.mock.calls.length - 1][0];

          const pinnedItem = feedPosts.find((o) => o.pinned === true);
          // there is no first billboard
          expect(lastCallbackResult.feedItems[0]).toEqual(pinnedItem);
          // there is no second bilboard so podcsats get rendered in 3rd place
          expect(lastCallbackResult.feedItems[2]).toEqual(podcastEpisodes);
          expect(lastCallbackResult.feedItems[7]).toEqual(thirdBillboard);
        });
      });
    });
  });
});