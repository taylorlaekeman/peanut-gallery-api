import axios from 'axios';
import * as cheerio from 'cheerio';

export interface MetascoreClient {
  getMetascore: (title: string) => Promise<number>;
}

export class HttpMetascoreClient implements MetascoreClient {
  async getMetascore(title: string): Promise<number> {
    const formattedTitle = this.formatTitle(title);
    const html = await this.loadWebpageHtml(formattedTitle);
    return this.parseMetascore(html);
  }

  private formatTitle(title: string): string {
    return title
      .toLowerCase()
      .split(' ')
      .join('-')
      .replace(/[':&]/g, '')
      .replace(/\s{2,}/g, ' ');
  }

  private async loadWebpageHtml(title: string): Promise<string> {
    try {
      const response = await axios.get<string>(
        `https://www.metacritic.com/movie/${title}`,
      );
      return response.data;
    } catch (error) {
      if (!axios.isAxiosError(error)) {
        throw error;
      }
      if (error.response?.status === 404) throw new MovieNotFoundError();
      throw error;
    }
  }

  private parseMetascore(html: string): number {
    const dom = cheerio.load(html);
    const $scoreRemainder = dom('span.c-productHero_scoreRemainder');
    if ($scoreRemainder.length > 0) throw new InsufficientReviewsError();
    const $score = dom('div.c-productScoreInfo div.c-siteReviewScore span');
    const metascore = parseInt($score.first().text(), 10);
    return metascore;
  }
}

export class TestMetascoreClient implements MetascoreClient {
  readonly responses: Record<string, TestResponse>;

  constructor({
    responses = {},
  }: { responses?: Record<string, TestResponse> } = {}) {
    this.responses = responses;
  }

  async getMetascore(title: string): Promise<number> {
    if (!(title in this.responses)) throw new MovieNotFoundError();
    const response = this.responses[title];
    if ('error' in response) throw response.error;
    return response.score;
  }
}

type TestResponse = { score: number } | { error: MetascoreClientError };

export class MetascoreClientError extends Error {}

export class MovieNotFoundError extends MetascoreClientError {}

export class InsufficientReviewsError extends MovieNotFoundError {}
